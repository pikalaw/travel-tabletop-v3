/**
 * The decision loop (technical design, "The decision loop"): three pure functions. `start` deals
 * and runs to the first decision; `legalActions` lists what the waiting player may answer;
 * `answer` checks a choice, applies it, and runs forward until the rules need the next choice.
 * The engine always gives priority as the rules say: passing for players is the controller's job.
 */
import type { ActivatedAbility, Effect, TargetSpec } from './abilities';
import { characteristics, isType, summoningSick, view } from './characteristics';
import { attackers, canAttack, canBlock, checkAttack, checkBlocks, checkSplit, dealCombatDamage, declareAttackers, declareBlockers, endCombat, hasFirstStrikeStep, splitsToAsk } from './combat';
import { runEffects } from './effects';
import { amount, holds, matches, type Context } from './evaluate';
import { parseCost, solvePayment, type ManaSource } from './mana';
import { seedRng } from './rng';
import { stateBasedActions } from './sba';
import { battlefield, controlledBy, createObject, draw, event, move, obj, printed, shuffleLibrary, zoneOf } from './state';
import { checkTargets, hasTargets, isLegalTarget, legalTargets, onlyChoice } from './targets';
import { fire, triggeredAbility } from './triggers';
import type { Choice, Color, Decision, GameObject, GameSetup, GameState, ManaSymbol, ObjectId, PendingTrigger, PlayerId, Refusal, Step, Target, ZoneId } from './types';
import { COLORS, PLAYERS, STEPS, other } from './types';
import { leaveBattlefield, putOntoBattlefield, tap } from './zones';

const HAND_SIZE = 7;
const STARTING_LIFE = 20;
const BASIC_MANA: Record<string, Color> = { Plains: 'W', Island: 'U', Swamp: 'B', Mountain: 'R', Forest: 'G' };
const PERMANENT_TYPES = ['Creature', 'Artifact', 'Enchantment', 'Planeswalker', 'Battle'];

const playerName = (s: GameState, p: PlayerId) => s.setup.players[p].name;
const freshTurnLog = (): GameState['turnLog'] => ({ attacked: { p1: false, p2: false }, lifeLost: { p1: 0, p2: 0 }, drawn: { p1: 0, p2: 0 } });
const nameOf = (s: GameState, id: ObjectId) => characteristics(s, obj(s, id)).name;
const hand = (s: GameState, p: PlayerId) => s.zones[zoneOf(p, 'hand')];

export function start(setup: GameSetup, seed: number): GameState {
  const zones = {} as Record<ZoneId, ObjectId[]>;
  for (const p of PLAYERS) for (const z of ['library', 'hand', 'graveyard', 'exile'] as const) zones[zoneOf(p, z)] = [];
  zones.battlefield = [];
  zones.stack = [];
  const emptyPool = () => ({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });
  const s: GameState = {
    seq: 0, setup, turn: 0, active: setup.first, step: 'untap', priority: null, passes: 0,
    players: Object.fromEntries(PLAYERS.map((p) => [p, {
      life: STARTING_LIFE, pool: emptyPool(), combatPool: emptyPool(), landsPlayed: 0, extraLands: 0, drewFromEmpty: false, mulligans: 0, kept: false,
    }])) as GameState['players'],
    objects: {}, zones, nextId: 1, nextTimestamp: 1, rng: seedRng(seed), decision: null, assignments: {},
    result: null, events: [], pendingTurnBased: false, effects: [], pendingTriggers: [], resolving: null,
    activatedThisTurn: {}, exhausted: {}, lastKnown: {}, turnLog: freshTurnLog(),
  };
  for (const p of PLAYERS) {
    for (const card of setup.players[p].deck) {
      if (!setup.cards[card]) throw new Error(`no card data for ${card} in ${p}'s deck`);
      createObject(s, card, p, zoneOf(p, 'library'));
    }
    shuffleLibrary(s, p);
    draw(s, p, HAND_SIZE);
  }
  s.decision = { kind: 'mulligan', player: setup.first };
  return s;
}

// ---------------------------------------------------------------------------------------------
// Abilities of objects, and mana.

const activatedOf = (s: GameState, id: ObjectId): ActivatedAbility[] => s.setup.cards[obj(s, id).card]?.script?.activated ?? [];
const spellOf = (s: GameState, id: ObjectId) => s.setup.cards[obj(s, id).card]?.script?.spell;
const ctxFor = (p: PlayerId, source: ObjectId): Context => ({ controller: p, source });

/** The mana a tap-only mana ability's effects add: the kinds, and how many (an "if … instead" counted as it stands). */
function manaYield(s: GameState, id: ObjectId, effects: Effect[]): { makes: (Color | 'C')[]; n: number } {
  const chosen = obj(s, id).chosenColor;
  const ctx: Context = { controller: obj(s, id).controller, source: id };
  let makes: (Color | 'C')[] = [];
  let n = 0;
  for (const e of effects) {
    if ('addMana' in e) {
      makes = [...makes, ...(e.anyColor ? [...COLORS] : [...e.addMana, ...(e.orChosenColor && chosen ? [chosen] : [])])];
      n = Math.max(n, typeof e.n === 'number' ? e.n : 1);
    } else if ('if' in e) {
      const branch = manaYield(s, id, holds(s, view(s), e.if, ctx) ? e.then : e.else ?? []);
      if (branch.n) { makes = [...makes, ...branch.makes]; n = branch.n; }
    }
  }
  return { makes, n };
}

/** What a permanent makes by tapping alone: basic land types (305.6) and "{T}: Add …" abilities. */
export function tapForMana(s: GameState, id: ObjectId): { makes: (Color | 'C')[]; n: number } | null {
  const c = characteristics(s, obj(s, id));
  const basic = c.subtypes.map((t) => BASIC_MANA[t]).filter((m): m is Color => !!m);
  let n = basic.length ? 1 : 0;
  const scripted: (Color | 'C')[] = [];
  if (!c.abilitiesRemoved) for (const a of activatedOf(s, id)) {
    if (!a.mana || !a.cost.tap || a.cost.mana || a.cost.sacrificeSelf || a.cost.payLife) continue;
    const y = manaYield(s, id, a.effects);
    scripted.push(...y.makes);
    n = Math.max(n, y.n);
  }
  const makes = [...new Set([...basic, ...scripted])];
  return makes.length ? { makes, n: Math.max(n, 1) } : null;
}

/**
 * What `p` can pay mana with now: floating mana (including mana that lasts until end of combat),
 * then untapped mana sources. For a waterbend cost, also each untapped artifact and creatures not
 * already a mana source, paying generic only (701.67; like convoke, summoning sickness doesn't matter).
 */
export function manaSources(s: GameState, p: PlayerId, opts: { waterbend?: boolean } = {}): ManaSource[] {
  const out: ManaSource[] = [];
  for (const [prefix, pool] of [['pool', s.players[p].pool], ['combat', s.players[p].combatPool]] as const) {
    for (const c of [...COLORS, 'C'] as const) for (let i = 0; i < pool[c]; i++) out.push({ id: `${prefix}:${c}:${i}`, makes: [c], floating: true });
  }
  const mana = new Set<ObjectId>();
  for (const o of controlledBy(s, p)) {
    if (o.tapped) continue;
    if (isType(s, o, 'Creature') && summoningSick(s, o)) continue;
    const t = tapForMana(s, o.id);
    if (!t) continue;
    // A source that makes two mana is two units of one tap: "id", then "id#1".
    for (let k = 0; k < t.n; k++) out.push({ id: k ? `${o.id}#${k}` : o.id, makes: t.makes });
    mana.add(o.id);
  }
  if (opts.waterbend) {
    for (const o of controlledBy(s, p)) {
      if (o.tapped || mana.has(o.id) || !(isType(s, o, 'Artifact') || isType(s, o, 'Creature'))) continue;
      out.push({ id: `wb:${o.id}`, makes: [], genericOnly: true });
    }
  }
  return out;
}

/**
 * A cost's mana and waterbend parts as one cost to solve, and the sources that may pay it. The
 * ability's own source is excluded when the cost taps it, and otherwise tapped for waterbend last.
 */
function costToPay(s: GameState, p: PlayerId, mana: ManaSymbol[], waterbend = 0, source?: ObjectId, tapsSource = false) {
  const cost: ManaSymbol[] = waterbend ? [...mana, { kind: 'generic', amount: waterbend }] : mana;
  const all = manaSources(s, p, { waterbend: waterbend > 0 }).filter((m) => !(tapsSource && (m.id === source || m.id === `wb:${source}`)));
  const own = all.filter((m) => m.id === `wb:${source}`);
  const sources = [...all.filter((m) => m.id !== `wb:${source}`), ...own];
  const plain = solvePayment(cost, sources);
  if (plain) return plain;
  // A "{1}: Add one mana of any color" ability (Barrels of Blasting Jelly) turns one other mana
  // into any colour: try each source in turn as the one spent on it.
  for (const conv of converters(s, p)) {
    for (let i = 0; i < sources.length; i++) {
      const m = sources[i]!;
      if (m.genericOnly || m.id === conv.id) continue;
      const via: ManaSource = { id: `via:${conv.id}:${conv.index}>${m.id}`, makes: [...COLORS], ...(m.floating ? { floating: true } : {}) };
      const got = solvePayment(cost, sources.map((x, j) => (j === i ? via : x)));
      if (got) return got;
    }
  }
  return null;
}

/** Untapped-or-not permanents with an unused "{1}: Add one mana of any color. Activate only once each turn." */
function converters(s: GameState, p: PlayerId): { id: ObjectId; index: number }[] {
  const out: { id: ObjectId; index: number }[] = [];
  for (const o of controlledBy(s, p)) {
    if (characteristics(s, o).abilitiesRemoved) continue;
    activatedOf(s, o.id).forEach((a, index) => {
      const any = a.effects.some((e) => 'addMana' in e && e.anyColor);
      if (a.mana && any && a.cost.mana === '{1}' && !a.cost.tap && a.oncePerTurn && !s.activatedThisTurn[`${o.id}:${index}`]) out.push({ id: o.id, index });
    });
  }
  return out;
}

function pay(s: GameState, p: PlayerId, sources: string[]): void {
  const tapped = new Map<ObjectId, number>();
  for (let id of sources) {
    if (id.startsWith('via:')) {
      // The mana from this source pays the converter's {1}; the converter makes the colour needed.
      const [conv, inner] = id.slice(4).split('>') as [string, string];
      s.activatedThisTurn[conv] = (s.activatedThisTurn[conv] ?? 0) + 1;
      event(s, `${playerName(s, p)} activates ${nameOf(s, conv.split(':')[0]!)} for mana of any colour`);
      id = inner;
    }
    const [kind, c] = id.split(':') as [string, Color | 'C'];
    if (kind === 'pool') s.players[p].pool[c]--;
    else if (kind === 'combat') s.players[p].combatPool[c]--;
    else if (kind === 'wb') tap(s, id.slice(3));
    else { const o = id.split('#')[0]!; tapped.set(o, (tapped.get(o) ?? 0) + 1); }
  }
  // Tapping a source makes all its mana; what this payment didn't use floats in the pool.
  for (const [id, used] of tapped) {
    const t = tapForMana(s, id)!;
    tap(s, id);
    if (t.n > used) s.players[p].pool[t.makes[0]!] += t.n - used;
  }
}

// ---------------------------------------------------------------------------------------------
// What a player may do now.

const sorcerySpeed = (s: GameState, p: PlayerId) =>
  s.active === p && (s.step === 'main1' || s.step === 'main2') && s.zones.stack.length === 0;

/** Why `p` can't play this land now, or null. */
/** "You may play that card this turn" (Zuko, Exiled Prince). */
const playableFromExile = (s: GameState, p: PlayerId, o: GameObject) => o.zone === zoneOf(p, 'exile') && o.owner === p && o.playableTurn === s.turn;

export function whyNotPlay(s: GameState, p: PlayerId, id: ObjectId): string | null {
  const o = s.objects[id];
  if (!o || (o.zone !== zoneOf(p, 'hand') && !playableFromExile(s, p, o))) return 'Not in your hand';
  if (!isType(s, o, 'Land')) return 'Not a land';
  if (!sorcerySpeed(s, p)) return 'Lands are played in your main phase with an empty stack';
  if (s.players[p].landsPlayed >= 1 + s.players[p].extraLands) return 'You have played a land this turn';
  return null;
}

/** Shifts every {target: n} in effects by `by`, so a mode's local target indices fit the whole spell. */
function shiftTargets<T>(v: T, by: number): T {
  if (Array.isArray(v)) return v.map((x) => shiftTargets(x, by)) as T;
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = (k === 'target' || k === 'controlledByTarget') && typeof x === 'number' ? x + by : shiftTargets(x, by);
    return out as T;
  }
  return v;
}

/** A spell's target specs and effects; for a modal spell, those of the chosen modes, in order. */
export function spellAbility(s: GameState, id: ObjectId, modes?: number[]): { specs: TargetSpec[]; effects: Effect[] } {
  const spell = spellOf(s, id);
  if (spell?.enchant) return { specs: [{ objects: spell.enchant }], effects: [] };
  if (!spell?.modes) return { specs: spell?.targets ?? [], effects: spell?.effects ?? [] };
  const specs: TargetSpec[] = [];
  const effects: Effect[] = [];
  for (const m of modes ?? []) {
    const mode = spell.modes.options[m]!;
    effects.push(...shiftTargets(mode.effects, specs.length));
    specs.push(...(mode.targets ?? []));
  }
  return { specs, effects };
}

function checkModes(s: GameState, id: ObjectId, modes?: number[]): string | null {
  const m = spellOf(s, id)?.modes;
  if (!m) return modes?.length ? 'This spell has no modes' : null;
  if (!modes) return 'Choose modes';
  if (modes.length < m.min || modes.length > m.max) return m.min === m.max ? `Choose ${m.min} mode${m.min > 1 ? 's' : ''}` : `Choose ${m.min} to ${m.max} modes`;
  if (modes.some((i) => !m.options[i])) return 'No such mode';
  if (new Set(modes).size !== modes.length && m.max < 3) return 'A mode is chosen twice';
  return null;
}

/** Why `p` can't cast this card now, or null. With `targets`, also whether those are legal. */
export function whyNotCast(s: GameState, p: PlayerId, id: ObjectId, targets?: Target[][], modes?: number[], x = 0): string | null {
  const o = s.objects[id];
  const fromExile = !!o && o.zone === zoneOf(p, 'exile') && o.owner === p && (!!o.airbended || playableFromExile(s, p, o));
  if (!o || (o.zone !== zoneOf(p, 'hand') && !fromExile)) return 'Not in your hand';
  if (isType(s, o, 'Land')) return 'Lands are played, not cast';
  const spellDef = spellOf(s, id);
  const instantSpeed = isType(s, o, 'Instant') || characteristics(s, o).keywords.includes('flash')
    || (!!spellDef?.flashIf && holds(s, view(s), spellDef.flashIf, ctxFor(p, id)));
  if (!instantSpeed && !sorcerySpeed(s, p)) return 'Only in your main phase with an empty stack';
  if (!spellPayment(s, p, id, x)) return 'Not enough mana of the right colours';
  const spell = spellOf(s, id);
  if (spell?.modes && targets === undefined) {
    // Castable if enough modes could each be chosen with legal targets.
    const ok = spell.modes.options.filter((m) => hasTargets(s, m.targets ?? [], ctxFor(p, id))).length;
    return ok >= spell.modes.min ? null : 'No legal target';
  }
  if (targets !== undefined) { const bad = checkModes(s, id, modes); if (bad) return bad; }
  const { specs } = spellAbility(s, id, modes);
  if (!hasTargets(s, specs, ctxFor(p, id))) return 'No legal target';
  return targets === undefined ? null : checkTargets(s, specs, targets, ctxFor(p, id));
}

/** The payment for casting a card now: its mana cost, or {2} from airbending exile (701.66), plus any additional waterbend cost. */
function spellPayment(s: GameState, p: PlayerId, id: ObjectId, x = 0) {
  const o = obj(s, id);
  const printedCost = o.zone.endsWith('.exile') && o.airbended ? parseCost('{2}') : printed(s, o).manaCost;
  // 107.3: X is paid as the chosen number.
  const cost = printedCost.map((m): ManaSymbol => (m.kind === 'x' ? { kind: 'generic', amount: x } : m));
  const spell = spellOf(s, id);
  const extra = spell?.additionalCost;
  let reduced = cost;
  if (spell?.reduceBy !== undefined) {
    // 601.2f: reductions take off generic mana only.
    let off = amount(s, view(s), spell.reduceBy, ctxFor(p, id));
    reduced = cost.map((m) => { if (m.kind !== 'generic' || off <= 0) return m; const take = Math.min(off, m.amount); off -= take; return { kind: 'generic', amount: m.amount - take }; });
  }
  return costToPay(s, p, extra?.mana ? [...reduced, ...parseCost(extra.mana)] : reduced, extra?.waterbend ?? 0);
}

/**
 * What a cast or an activation would spend, for the confirm step: the permanents it taps (for mana,
 * waterbend or a converter) and the floating mana it uses. Null if it can't be paid.
 */
export function paymentPreview(s: GameState, p: PlayerId, c: Choice): { tapped: ObjectId[]; floating: number } | null {
  let pay: { sources: string[] } | null = null;
  if (c.kind === 'cast') pay = s.objects[c.object] ? spellPayment(s, p, c.object, c.x ?? 0) : null;
  else if (c.kind === 'activate') {
    const a = s.objects[c.object] ? activatedOf(s, c.object)[c.ability] : undefined;
    if (!a) return null;
    pay = a.cost.mana || a.cost.waterbend ? costToPay(s, p, parseCost(a.cost.mana ?? ''), a.cost.waterbend, c.object, !!a.cost.tap) : { sources: [] };
  }
  if (!pay) return null;
  const tapped = new Set<ObjectId>();
  let floating = 0;
  for (const id of pay.sources) {
    const inner = id.startsWith('via:') ? id.split('>')[1]! : id;
    if (inner.startsWith('pool:') || inner.startsWith('combat:')) floating++;
    else tapped.add((inner.startsWith('wb:') ? inner.slice(3) : inner).split('#')[0]!);
  }
  return { tapped: [...tapped], floating };
}

/** Why `p` can't activate ability `index` of this permanent now, or null. With `targets`, also whether those are legal. */
/** Creatures that could be tapped for a "tap an untapped creature you control" cost. */
export function tapCandidates(s: GameState, p: PlayerId, a: ActivatedAbility): ObjectId[] {
  const f = a.cost.tapAnother;
  if (!f) return [];
  return controlledBy(s, p).filter((o) => !o.tapped && isType(s, o, 'Creature') && matches(s, view(s), o, f, ctxFor(p, o.id))).map((o) => o.id);
}

export function whyNotActivate(s: GameState, p: PlayerId, id: ObjectId, index: number, targets?: Target[][], tapping?: ObjectId[]): string | null {
  const o = s.objects[id];
  const a = o ? activatedOf(s, id)[index] : undefined;
  if (!o || !a) return 'No such ability';
  const where = a.zone ? zoneOf(p, a.zone) : 'battlefield';
  if (o.zone !== where || (where === 'battlefield' ? o.controller !== p : o.owner !== p)) {
    return a.zone === 'hand' ? 'Not in your hand' : a.zone === 'graveyard' ? 'Not in your graveyard' : 'Not a permanent you control';
  }
  if (characteristics(s, o).abilitiesRemoved) return 'It has lost its abilities';
  if (a.timing === 'sorcery' && !sorcerySpeed(s, p)) return 'Only as a sorcery';
  if (a.timing === 'yourTurn' && s.active !== p) return 'Only during your turn';
  if (a.oncePerTurn && s.activatedThisTurn[`${id}:${index}`]) return 'Only once each turn';
  if (a.exhaust && s.exhausted[`${id}:${index}`]) return 'Exhaust: it has been activated';
  if (a.cost.tap && o.tapped) return 'It is tapped';
  if (a.cost.tap && isType(s, o, 'Creature') && summoningSick(s, o)) return 'It came under your control this turn';
  if (a.cost.payLife && s.players[p].life < a.cost.payLife) return 'Not enough life';
  if (a.cost.tapAnother) {
    const can = tapCandidates(s, p, a);
    if (!can.length) return 'No untapped creature to tap';
    if (tapping && (tapping.length !== 1 || !can.includes(tapping[0]!))) return 'Choose an untapped creature you control to tap';
  }
  // Mana for the cost comes from other sources when the ability taps this one.
  if ((a.cost.mana || a.cost.waterbend) && !costToPay(s, p, parseCost(a.cost.mana ?? ''), a.cost.waterbend, id, !!a.cost.tap)) return 'Not enough mana of the right colours';
  if (!hasTargets(s, a.targets ?? [], ctxFor(p, id))) return 'No legal target';
  return targets === undefined ? null : checkTargets(s, a.targets ?? [], targets, ctxFor(p, id));
}

/**
 * Every choice the waiting player may make now, where the choices can be listed. Casts and
 * activations are listed without targets; `targetOptions` gives what each could target.
 */
export function legalActions(s: GameState): Choice[] {
  const d = s.decision;
  if (!d) return [];
  switch (d.kind) {
    case 'mulligan': return [{ kind: 'keep' }, { kind: 'mulligan' }];
    case 'legend': return d.objects.map((keep) => ({ kind: 'legend', keep }));
    case 'may': case 'payOrElse': return [{ kind: 'yes' }, { kind: 'no' }];
    case 'priority': {
      const p = d.player;
      const out: Choice[] = [{ kind: 'pass' }];
      for (const id of hand(s, p)) {
        if (!whyNotPlay(s, p, id)) out.push({ kind: 'play', object: id });
        if (!whyNotCast(s, p, id)) out.push({ kind: 'cast', object: id });
      }
      for (const id of s.zones[zoneOf(p, 'exile')]) {
        if (!whyNotPlay(s, p, id)) out.push({ kind: 'play', object: id });
        if (!whyNotCast(s, p, id)) out.push({ kind: 'cast', object: id });
      }
      const withAbilities = [...controlledBy(s, p).map((o) => o.id), ...hand(s, p), ...s.zones[zoneOf(p, 'graveyard')]];
      for (const id of withAbilities) {
        activatedOf(s, id).forEach((a, i) => { if (!a.mana && !whyNotActivate(s, p, id, i)) out.push({ kind: 'activate', object: id, ability: i }); });
      }
      return out;
    }
    default: return [];
  }
}

/** What each target spec of a card's spell, or of a permanent's ability, may target now. */
export function targetOptions(s: GameState, p: PlayerId, id: ObjectId, ability?: number): { spec: TargetSpec; legal: Target[] }[] {
  const specs = ability === undefined ? spellOf(s, id)?.targets ?? [] : activatedOf(s, id)[ability]?.targets ?? [];
  return specs.map((spec) => ({ spec, legal: legalTargets(s, spec, ctxFor(p, id)) }));
}

/** For a "triggerTargets" decision: what each of the trigger's target specs may target. */
export function triggerTargetOptions(s: GameState): { spec: TargetSpec; legal: Target[] }[] {
  const d = s.decision;
  if (d?.kind !== 'triggerTargets') return [];
  const t = s.pendingTriggers[d.trigger]!;
  return (triggeredAbility(s, t.card, t.index).targets ?? []).map((spec) => ({ spec, legal: legalTargets(s, spec, triggerCtx(t)) }));
}

/** Creatures that may attack now; for the UI and for tests. */
export const attackCandidates = (s: GameState) => battlefield(s).filter((o) => canAttack(s, o)).map((o) => o.id);

/** Each legal blocker with the attackers it may block. */
export const blockCandidates = (s: GameState) => battlefield(s).flatMap((b) => {
  const can = attackers(s).filter((a) => canBlock(s, b, a)).map((a) => a.id);
  return can.length ? [{ blocker: b.id, attackers: can }] : [];
});

// ---------------------------------------------------------------------------------------------
// Answering.

export function answer(state: GameState, choice: Choice): GameState | Refusal {
  const d = state.decision;
  if (!d) return { refused: state.result ? 'The game is over' : 'Nothing to decide' };
  // The setup (decks and card data) never changes, so every state shares it; the rest is copied.
  const { setup, ...rest } = state;
  const s: GameState = { ...structuredClone(rest), setup };
  if (choice.kind === 'concede') {
    s.decision = null;
    s.result = { winner: other(choice.player), reason: `${playerName(s, choice.player)} resigns` };
    event(s, s.result.reason);
    s.seq++;
    return s;
  }
  s.decision = null;
  const refusal = apply(s, d, choice);
  if (refusal) return { refused: refusal };
  s.seq++;
  run(s);
  return s;
}

const wrong = (d: Decision, c: Choice) => `Expected an answer to "${d.kind}", got "${c.kind}"`;

function apply(s: GameState, d: Decision, c: Choice): string | null {
  const p = d.player;
  switch (d.kind) {
    case 'mulligan': {
      if (c.kind === 'keep') {
        s.players[p].kept = true;
        event(s, `${playerName(s, p)} keeps ${hand(s, p).length} cards`);
        if (s.players[p].mulligans > 0) s.decision = { kind: 'bottom', player: p, count: s.players[p].mulligans };
        else nextMulligan(s, p);
        return null;
      }
      if (c.kind !== 'mulligan') return wrong(d, c);
      s.players[p].mulligans++;
      for (const id of [...hand(s, p)]) move(s, id, zoneOf(p, 'library'));
      shuffleLibrary(s, p);
      draw(s, p, HAND_SIZE);
      event(s, `${playerName(s, p)} mulligans`);
      s.decision = { kind: 'mulligan', player: p };
      return null;
    }
    case 'bottom': {
      if (c.kind !== 'bottom') return wrong(d, c);
      const bad = checkCards(s, p, c.cards, d.count);
      if (bad) return bad;
      for (const id of c.cards) move(s, id, zoneOf(p, 'library'), { bottom: true });
      event(s, `${playerName(s, p)} puts ${d.count} card${d.count > 1 ? 's' : ''} on the bottom of their library`);
      nextMulligan(s, p);
      return null;
    }
    case 'priority': return applyPriority(s, p, c);
    case 'attackers': {
      if (c.kind !== 'attack') return wrong(d, c);
      const bad = checkAttack(s, c.attackers);
      if (bad) return bad;
      declareAttackers(s, c.attackers);
      finishTurnBased(s);
      return null;
    }
    case 'blockers': {
      if (c.kind !== 'block') return wrong(d, c);
      const bad = checkBlocks(s, c.blocks);
      if (bad) return bad;
      declareBlockers(s, c.blocks);
      finishTurnBased(s);
      return null;
    }
    case 'damage': {
      if (c.kind !== 'damage') return wrong(d, c);
      const bad = checkSplit(s, obj(s, d.attacker), c.assign);
      if (bad) return bad;
      s.assignments[d.attacker] = c.assign;
      return null; // the damage step's turn-based action picks up the next split, or deals damage
    }
    case 'discard': {
      if (c.kind !== 'discard') return wrong(d, c);
      const bad = checkCards(s, p, c.cards, d.count);
      if (bad) return bad;
      for (const id of c.cards) { event(s, `${playerName(s, p)} discards ${nameOf(s, id)}`); move(s, id, zoneOf(p, 'graveyard')); }
      return null;
    }
    case 'legend': {
      if (c.kind !== 'legend') return wrong(d, c);
      if (!d.objects.includes(c.keep)) return 'Keep one of the named permanents';
      const rest = d.objects.filter((id) => id !== c.keep);
      for (const id of rest) event(s, `${nameOf(s, id)} goes to the graveyard (legend rule)`);
      leaveBattlefield(s, rest, 'graveyard', { dies: true });
      return null;
    }
    case 'triggerOrder': {
      if (c.kind !== 'order') return wrong(d, c);
      const mine = d.triggers;
      if ([...c.triggers].sort().join() !== [...mine].sort().join()) return 'Order every one of your triggers';
      // The first in the chosen order goes on the stack first, so it resolves last.
      const chosen = c.triggers.map((i) => s.pendingTriggers[i]!);
      let k = 0;
      s.pendingTriggers = s.pendingTriggers.map((t, i) => (mine.includes(i) ? { ...chosen[k++]!, ordered: true } : t));
      return null;
    }
    case 'triggerTargets': {
      if (c.kind !== 'targets') return wrong(d, c);
      const t = s.pendingTriggers[d.trigger]!;
      const bad = checkTargets(s, triggeredAbility(s, t.card, t.index).targets ?? [], c.targets, triggerCtx(t));
      if (bad) return bad;
      stackTrigger(s, d.trigger, c.targets);
      return null;
    }
    case 'may': {
      if (c.kind !== 'yes' && c.kind !== 'no') return wrong(d, c);
      continueResolving(s, c);
      return null;
    }
    case 'discardEffect': {
      if (c.kind !== 'discard') return wrong(d, c);
      const bad = checkCards(s, p, c.cards, d.count);
      if (bad) return bad;
      continueResolving(s, c);
      return null;
    }
    case 'optionalCost': {
      if (c.kind !== 'optionalCost') return wrong(d, c);
      if (c.objects.length && (c.objects.length !== d.count || c.objects.some((id) => !d.options.includes(id)) || new Set(c.objects).size !== c.objects.length)) {
        return `Choose ${d.count} or none`;
      }
      continueResolving(s, c);
      return null;
    }
    case 'payOrElse': {
      if (c.kind !== 'yes' && c.kind !== 'no') return wrong(d, c);
      const payment = costToPay(s, p, parseCost(d.cost), d.waterbend ?? 0);
      if (c.kind === 'yes' && !payment) return 'Not enough mana';
      if (c.kind === 'yes') pay(s, p, payment!.sources);
      continueResolving(s, c);
      return null;
    }
    case 'chooseColor': {
      if (c.kind !== 'color') return wrong(d, c);
      if (!d.options.includes(c.color)) return 'Choose one of the offered colours';
      obj(s, d.object).chosenColor = c.color;
      event(s, `${playerName(s, p)} chooses ${c.color} for ${nameOf(s, d.object)}`);
      return null;
    }
    case 'arrange': {
      if (c.kind !== 'arrange') return wrong(d, c);
      const all = [...c.top, ...c.away];
      if (all.length !== d.cards.length || new Set(all).size !== all.length || all.some((id) => !d.cards.includes(id))) return 'Place each looked-at card once';
      continueResolving(s, c);
      return null;
    }
    case 'pick': {
      if (c.kind !== 'pick') return wrong(d, c);
      if (c.cards.length < d.min || c.cards.length > d.max || new Set(c.cards).size !== c.cards.length || c.cards.some((id) => !d.options.includes(id))) {
        return d.min === d.max ? `Choose ${d.min} of the cards offered` : `Choose up to ${d.max} of the cards offered`;
      }
      continueResolving(s, c);
      return null;
    }
    case 'search': {
      if (c.kind !== 'search') return wrong(d, c);
      if (c.cards.length > d.max || new Set(c.cards).size !== c.cards.length || c.cards.some((id) => !d.options.includes(id))) return `Choose up to ${d.max} of the cards that match`;
      continueResolving(s, c);
      return null;
    }
  }
}

function checkCards(s: GameState, p: PlayerId, cards: ObjectId[], count: number): string | null {
  if (cards.length !== count) return `Choose exactly ${count} card${count > 1 ? 's' : ''}`;
  if (new Set(cards).size !== cards.length) return 'A card is chosen twice';
  if (cards.some((id) => s.objects[id]?.zone !== zoneOf(p, 'hand'))) return 'Choose cards from your hand';
  return null;
}

/** After a player's mulligans are settled: the other player, or the first turn. */
function nextMulligan(s: GameState, p: PlayerId): void {
  const q = other(p);
  if (!s.players[q].kept) { s.decision = { kind: 'mulligan', player: q }; return; }
  s.turn = 1;
  s.active = s.setup.first;
  enterStep(s, 'untap');
}

function applyPriority(s: GameState, p: PlayerId, c: Choice): string | null {
  switch (c.kind) {
    case 'pass': {
      s.passes++;
      if (s.passes < 2) { s.priority = other(p); return null; }
      s.passes = 0;
      s.priority = null;
      if (s.zones.stack.length) resolveTop(s);
      return null;
    }
    case 'play': {
      const bad = whyNotPlay(s, p, c.object);
      if (bad) return bad;
      event(s, `${playerName(s, p)} plays ${nameOf(s, c.object)}`);
      const land = putOntoBattlefield(s, c.object, p);
      s.players[p].landsPlayed++;
      // "As it enters, choose a color": asked straight away, before anyone could use it.
      const choose = s.setup.cards[obj(s, land).card]?.script?.replacements?.find((r) => 'entersChoosingColor' in r.replace)?.replace;
      if (choose && 'entersChoosingColor' in choose) s.decision = { kind: 'chooseColor', player: p, object: land, options: COLORS.filter((x) => x !== choose.entersChoosingColor.except) };
      s.passes = 0;
      return null;
    }
    case 'cast': {
      const specs = s.objects[c.object] ? spellAbility(s, c.object, c.modes).specs : [];
      const x = c.x ?? 0;
      if (!Number.isInteger(x) || x < 0) return 'X must be a whole number';
      const bad = whyNotCast(s, p, c.object, c.targets ?? [], c.modes, x);
      if (bad) return specs.length && !c.targets ? 'Choose targets' : bad;
      pay(s, p, spellPayment(s, p, c.object, x)!.sources);
      event(s, `${playerName(s, p)} casts ${nameOf(s, c.object)}${c.x !== undefined ? ` with X = ${x}` : ''}${describeTargets(s, c.targets)}`);
      const spell = move(s, c.object, 'stack', { controller: p });
      spell.targets = c.targets ?? [];
      if (c.modes) spell.modes = c.modes;
      if (c.x !== undefined) spell.x = x;
      s.passes = 0;
      fire(s, { kind: 'cast', object: spell.id, player: p }); // 601.2i
      return null;
    }
    case 'activate': {
      const specs = s.objects[c.object] ? activatedOf(s, c.object)[c.ability]?.targets ?? [] : [];
      const a = s.objects[c.object] ? activatedOf(s, c.object)[c.ability] : undefined;
      const tapping = c.tapping ?? (a && tapCandidates(s, p, a).length === 1 ? tapCandidates(s, p, a) : undefined);
      const bad = whyNotActivate(s, p, c.object, c.ability, c.targets ?? [], tapping);
      if (bad) return specs.length && !c.targets ? 'Choose targets' : bad;
      if (a?.cost.tapAnother && !tapping) return 'Choose a creature to tap';
      return activate(s, p, c.object, c.ability, c.targets ?? [], tapping ?? []);
    }
    default:
      return `Expected an answer to "priority", got "${c.kind}"`;
  }
}

function describeTargets(s: GameState, targets?: Target[][]): string {
  const ts = (targets ?? []).flat();
  if (!ts.length) return '';
  return ` targeting ${ts.map((t) => (t === 'p1' || t === 'p2' ? playerName(s, t) : nameOf(s, t))).join(', ')}`;
}

/** Activates an ability (602.2): pay its costs; a mana ability then resolves at once (605.3), any other goes on the stack. */
/** Activates an ability whose legality was checked; refuses (the copy is dropped) if tapping a creature for the cost left too little mana. */
function activate(s: GameState, p: PlayerId, id: ObjectId, index: number, targets: Target[][], tapping: ObjectId[] = []): string | null {
  const a = activatedOf(s, id)[index]!;
  const card = obj(s, id).card;
  const sourceName = nameOf(s, id);
  s.activatedThisTurn[`${id}:${index}`] = (s.activatedThisTurn[`${id}:${index}`] ?? 0) + 1;
  if (a.exhaust) s.exhausted[`${id}:${index}`] = true;
  for (const t of tapping) { tap(s, t); event(s, `${playerName(s, p)} taps ${nameOf(s, t)}`); }
  if (a.cost.mana || a.cost.waterbend) {
    const payment = costToPay(s, p, parseCost(a.cost.mana ?? ''), a.cost.waterbend, id, !!a.cost.tap);
    if (!payment) return 'Not enough mana of the right colours';
    pay(s, p, payment.sources);
  }
  if (a.cost.tap) tap(s, id);
  if (a.cost.payLife) s.players[p].life -= a.cost.payLife;
  if (a.mana) {
    s.resolving = { object: id, effects: a.effects, pc: 0, controller: p, source: id, targets, specs: [] };
    runEffects(s);
    s.resolving = null;
    if (a.cost.sacrificeSelf) leaveBattlefield(s, [id], 'graveyard');
    return null;
  }
  const ab = createObject(s, card, p, 'stack');
  const attachedTo = obj(s, id).attachedTo;
  ab.ability = { source: id, sourceName, kind: 'activated', index, ...(attachedTo ? { attachedTo } : {}) };
  ab.targets = targets;
  if (a.cost.sacrificeSelf) leaveBattlefield(s, [id], 'graveyard');
  if (a.cost.discardSelf) { event(s, `${playerName(s, p)} discards ${sourceName}`); move(s, id, zoneOf(p, 'graveyard')); }
  event(s, `${playerName(s, p)} activates ${sourceName}: ${a.text}${describeTargets(s, targets)}`);
  s.passes = 0;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Triggers onto the stack (603.3b).

const triggerCtx = (t: PendingTrigger): Context =>
  ({ controller: t.controller, source: t.source, ...(t.eventObject ? { eventObject: t.eventObject } : {}) });

/** Puts pending triggers on the stack, active player's first, asking orders and targets where they're real choices. */
function stackTriggers(s: GameState): void {
  while (s.pendingTriggers.length) {
    const p = s.pendingTriggers.some((t) => t.controller === s.active) ? s.active : other(s.active); // APNAP
    const mine = s.pendingTriggers.flatMap((t, i) => (t.controller === p ? [i] : []));
    const ts = mine.map((i) => s.pendingTriggers[i]!);
    const alike = ts.every((t) => t.card === ts[0]!.card && t.index === ts[0]!.index);
    if (mine.length > 1 && !alike && !ts.every((t) => t.ordered)) {
      s.decision = { kind: 'triggerOrder', player: p, triggers: mine };
      return;
    }
    const i = mine[0]!;
    const t = s.pendingTriggers[i]!;
    const specs = triggeredAbility(s, t.card, t.index).targets ?? [];
    const ctx = triggerCtx(t);
    if (!specs.length) { stackTrigger(s, i, []); continue; }
    if (!hasTargets(s, specs, ctx)) { s.pendingTriggers.splice(i, 1); continue; } // 603.3d: removed without legal targets
    const only = onlyChoice(s, specs, ctx);
    if (only) { stackTrigger(s, i, only); continue; }
    s.decision = { kind: 'triggerTargets', player: p, trigger: i };
    return;
  }
}

function stackTrigger(s: GameState, i: number, targets: Target[][]): void {
  const t = s.pendingTriggers.splice(i, 1)[0]!;
  const ab = createObject(s, t.card, t.controller, 'stack');
  ab.ability = { source: t.source, sourceName: t.sourceName, kind: 'triggered', index: t.index, ...(t.eventObject ? { eventObject: t.eventObject } : {}) };
  ab.targets = targets;
  event(s, `${t.sourceName}'s ability triggers${describeTargets(s, targets)}`);
}

// ---------------------------------------------------------------------------------------------
// Resolving (608).

function resolveTop(s: GameState): void {
  const id = s.zones.stack[s.zones.stack.length - 1]!;
  const o = obj(s, id);
  const a = o.ability;
  let effects: Effect[];
  let specs: TargetSpec[];
  const source = a ? a.source : id;
  const ctx: Context = { controller: o.controller, source, ...(a?.eventObject ? { eventObject: a.eventObject } : {}) };
  const label = a ? `${a.sourceName}'s ability` : nameOf(s, id);
  if (a) {
    const def = a.kind === 'activated' ? s.setup.cards[o.card]!.script!.activated![a.index]! : triggeredAbility(s, o.card, a.index);
    effects = def.effects;
    specs = def.targets ?? [];
    // 603.4: an intervening "if" is checked again on resolution; if false, the ability does nothing.
    if (a.kind === 'triggered' && 'if' in def && def.if && !holds(s, view(s), def.if, ctx)) {
      removeFromStack(s, id);
      s.priority = s.active;
      return;
    }
  } else {
    ({ effects, specs } = spellAbility(s, id, o.modes));
  }
  // 608.2b: targets are checked again; with every one illegal, the spell or ability does nothing.
  const chosen = o.targets ?? [];
  const legal = chosen.map((ts, i) => ts.filter((t) => isLegalTarget(s, specs[i]!, ctx, t)));
  if (chosen.flat().length && legal.flat().length === 0) {
    event(s, `${label} does nothing: its target${chosen.flat().length > 1 ? 's are' : ' is'} no longer legal`);
    finish(s, id);
    s.priority = s.active;
    return;
  }
  event(s, `${label} resolves`);
  if (!a && PERMANENT_TYPES.some((t) => isType(s, o, t))) {
    const attachTo = spellOf(s, id)?.enchant ? legal[0]?.[0] : undefined;
    putOntoBattlefield(s, id, o.controller, attachTo ? { attachTo } : {});
    s.priority = s.active;
    return;
  }
  s.resolving = { object: id, effects: [...effects], pc: 0, controller: o.controller, source, targets: legal, specs, ...(ctx.eventObject ? { eventObject: ctx.eventObject } : {}), ...(o.x !== undefined ? { x: o.x } : {}), ...(a?.attachedTo ? { attachedTo: a.attachedTo } : {}) };
  continueResolving(s);
}

/** Runs the resolving spell or ability on; when it finishes it leaves the stack, and the active player gets priority (117.3b). */
function continueResolving(s: GameState, c?: Choice): void {
  if (runEffects(s, c) === 'wait') return;
  const id = s.resolving!.object;
  s.resolving = null;
  finish(s, id);
  s.priority = s.active;
}

/** A resolved spell goes to its owner's graveyard (608.2n); an ability simply ceases to exist. */
function finish(s: GameState, id: ObjectId): void {
  const o = s.objects[id];
  if (!o || o.zone !== 'stack') return;
  if (o.ability) removeFromStack(s, id); else move(s, id, zoneOf(o.owner, 'graveyard'));
}

function removeFromStack(s: GameState, id: ObjectId): void {
  s.zones.stack.splice(s.zones.stack.indexOf(id), 1);
  delete s.objects[id];
}

// ---------------------------------------------------------------------------------------------
// Running forward: steps, turn-based actions, triggers and priority.

function run(s: GameState): void {
  for (let guard = 0; guard < 10_000; guard++) {
    if (s.result) { s.decision = null; s.priority = null; return; }
    if (s.decision) return;
    if (s.turn === 0) return; // mulligans; their decisions drive the start
    if (s.resolving) return;  // a resolution is waiting on a choice, and its decision is set
    if (s.pendingTurnBased) { turnBased(s); continue; }
    if (s.priority) {
      // 117.5: whenever a player would receive priority, state-based actions repeat until none
      // apply, then triggers go on the stack; then check again.
      if (stateBasedActions(s)) continue;
      if (s.pendingTriggers.length) { stackTriggers(s); continue; }
      s.decision = { kind: 'priority', player: s.priority };
      return;
    }
    // Nobody has priority: a step without it, or both passed with an empty stack.
    advance(s);
  }
  throw new Error('the engine ran 10,000 steps without needing a decision');
}

function advance(s: GameState): void {
  const i = STEPS.indexOf(s.step);
  if (s.step === 'endCombat') {
    endCombat(s);
    s.effects = s.effects.filter((e) => e.duration !== 'endOfCombat');
    for (const q of PLAYERS) for (const c of [...COLORS, 'C'] as const) s.players[q].combatPool[c] = 0;
  }
  if (i === STEPS.length - 1) {
    s.turn++;
    s.active = other(s.active);
    s.players[s.active].landsPlayed = 0;
    for (const q of PLAYERS) s.players[q].extraLands = 0;
    s.activatedThisTurn = {};
    s.turnLog = freshTurnLog();
    s.lastKnown = {}; // every leave trigger has resolved: the stack was empty to end the turn
    enterStep(s, 'untap');
    return;
  }
  enterStep(s, STEPS[i + 1]!);
}

function enterStep(s: GameState, step: Step): void {
  s.step = step;
  s.passes = 0;
  s.priority = null;
  for (const p of PLAYERS) for (const c of [...COLORS, 'C'] as const) s.players[p].pool[c] = 0; // 500.4
  s.pendingTurnBased = true;
}

const STEP_TRIGGERS: Step[] = ['upkeep', 'draw', 'main1', 'beginCombat', 'main2', 'end'];

/** Ends the current step's turn-based action and gives priority where the step has it. */
function finishTurnBased(s: GameState): void {
  s.pendingTurnBased = false;
  s.priority = s.step === 'untap' || s.step === 'cleanup' ? null : s.active;
  if (STEP_TRIGGERS.includes(s.step)) fire(s, { kind: 'step', step: s.step }); // "at the beginning of"
}

/** The current step's turn-based action. It may stop on a decision; the answer finishes it, or it runs again. */
function turnBased(s: GameState): void {
  const a = s.active;
  switch (s.step) {
    case 'untap':
      for (const o of battlefield(s)) {
        const always = s.setup.cards[o.card]?.script?.replacements?.some((r) => 'untapsEachUntapStep' in r.replace);
        if (o.controller !== a && !always) continue;
        if (characteristics(s, o).keywords.includes("doesn't untap") && o.controller === a) continue; // 502.3
        if (!o.tapped) continue;
        // 122.1d: a stunned permanent stays tapped, losing a stun counter instead of untapping.
        if ((o.counters.stun ?? 0) > 0) { o.counters.stun!--; continue; }
        o.tapped = false;
      }
      break;
    case 'draw':
      if (!(s.turn === 1 && a === s.setup.first)) { draw(s, a); event(s, `${playerName(s, a)} draws a card`); }
      break;
    case 'attackers':
      // With nothing able to attack, the declaration is empty and nobody is asked.
      if (attackCandidates(s).length) { s.decision = { kind: 'attackers', player: a }; return; }
      break;
    case 'blockers':
      if (attackers(s).length === 0) { skip(s); return; } // 508.8
      if (blockCandidates(s).length) { s.decision = { kind: 'blockers', player: other(a) }; return; }
      break;
    case 'firstStrikeDamage':
    case 'damage': {
      if (attackers(s).length === 0 || (s.step === 'firstStrikeDamage' && !hasFirstStrikeStep(s))) { skip(s); return; }
      const ask = splitsToAsk(s)[0];
      if (ask) {
        const c = characteristics(s, ask);
        s.decision = { kind: 'damage', player: ask.controller, attacker: ask.id, blockers: [...(ask.blockedBy ?? [])], power: c.power, trample: c.keywords.includes('trample') };
        return; // the UI pre-fills combat.proposedSplit
      }
      dealCombatDamage(s);
      break;
    }
    case 'cleanup': {
      const extra = hand(s, a).length - HAND_SIZE;
      if (extra > 0) { s.decision = { kind: 'discard', player: a, count: extra }; return; }
      // 514.2: damage wears off and "until end of turn" effects end, at the same time.
      for (const o of battlefield(s)) { o.damage = 0; o.deathtouched = false; }
      s.effects = s.effects.filter((e) => e.duration !== 'endOfTurn' && e.duration !== 'endOfCombat');
      break;
    }
    default:
      break;
  }
  finishTurnBased(s);
}

/** Skips a step that doesn't happen (508.8, 510.4): no turn-based action and no priority. */
function skip(s: GameState): void {
  s.pendingTurnBased = false;
  s.priority = null;
}
