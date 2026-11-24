/**
 * The decision loop (technical design, "The decision loop"): three pure functions. `start` deals
 * and runs to the first decision; `legalActions` lists what the waiting player may answer;
 * `answer` checks a choice, applies it, and runs forward until the rules need the next choice.
 * The engine always gives priority as the rules say: passing for players is the controller's job.
 */
import { characteristics, isType } from './characteristics';
import { attackers, canAttack, canBlock, checkAttack, checkBlocks, checkSplit, dealCombatDamage, declareAttackers, declareBlockers, endCombat, hasFirstStrikeStep, splitsToAsk } from './combat';
import { solvePayment, type ManaSource } from './mana';
import { seedRng } from './rng';
import { stateBasedActions } from './sba';
import { battlefield, controlledBy, createObject, draw, event, move, obj, printed, shuffleLibrary, zoneOf } from './state';
import type { Choice, Color, Decision, GameSetup, GameState, ObjectId, PlayerId, Refusal, Step, ZoneId } from './types';
import { COLORS, PLAYERS, STEPS, other } from './types';

const HAND_SIZE = 7;
const STARTING_LIFE = 20;
const BASIC_MANA: Record<string, Color> = { Plains: 'W', Island: 'U', Swamp: 'B', Mountain: 'R', Forest: 'G' };

const playerName = (s: GameState, p: PlayerId) => s.setup.players[p].name;
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
      life: STARTING_LIFE, pool: emptyPool(), landsPlayed: 0, drewFromEmpty: false, mulligans: 0, kept: false,
    }])) as GameState['players'],
    objects: {}, zones, nextId: 1, nextTimestamp: 1, rng: seedRng(seed), decision: null, assignments: {},
    result: null, events: [], pendingTurnBased: false,
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
// What a player may do now.

export function manaSources(s: GameState, p: PlayerId): ManaSource[] {
  const out: ManaSource[] = [];
  const pool = s.players[p].pool;
  for (const c of [...COLORS, 'C'] as const) for (let i = 0; i < pool[c]; i++) out.push({ id: `pool:${c}:${i}`, makes: [c], floating: true });
  for (const o of controlledBy(s, p)) {
    if (o.tapped || !isType(s, o, 'Land')) continue;
    const makes = characteristics(s, o).subtypes.map((t) => BASIC_MANA[t]).filter((c): c is Color => !!c);
    if (makes.length) out.push({ id: o.id, makes });
  }
  return out;
}

const sorcerySpeed = (s: GameState, p: PlayerId) =>
  s.active === p && (s.step === 'main1' || s.step === 'main2') && s.zones.stack.length === 0;

/** Why `p` can't play this land now, or null. */
export function whyNotPlay(s: GameState, p: PlayerId, id: ObjectId): string | null {
  const o = s.objects[id];
  if (!o || o.zone !== zoneOf(p, 'hand')) return 'Not in your hand';
  if (!isType(s, o, 'Land')) return 'Not a land';
  if (!sorcerySpeed(s, p)) return 'Lands are played in your main phase with an empty stack';
  if (s.players[p].landsPlayed >= 1) return 'You have played a land this turn';
  return null;
}

/** Why `p` can't cast this card now, or null. */
export function whyNotCast(s: GameState, p: PlayerId, id: ObjectId): string | null {
  const o = s.objects[id];
  if (!o || o.zone !== zoneOf(p, 'hand')) return 'Not in your hand';
  if (isType(s, o, 'Land')) return 'Lands are played, not cast';
  const instantSpeed = isType(s, o, 'Instant') || characteristics(s, o).keywords.includes('flash');
  if (!instantSpeed && !sorcerySpeed(s, p)) return 'Only in your main phase with an empty stack';
  if (!solvePayment(printed(s, o).manaCost, manaSources(s, p))) return 'Not enough mana of the right colours';
  return null;
}

/** Every choice the waiting player may make now, where the choices can be listed. */
export function legalActions(s: GameState): Choice[] {
  const d = s.decision;
  if (!d) return [];
  switch (d.kind) {
    case 'mulligan': return [{ kind: 'keep' }, { kind: 'mulligan' }];
    case 'legend': return d.objects.map((keep) => ({ kind: 'legend', keep }));
    case 'priority': {
      const out: Choice[] = [{ kind: 'pass' }];
      for (const id of hand(s, d.player)) {
        if (!whyNotPlay(s, d.player, id)) out.push({ kind: 'play', object: id });
        if (!whyNotCast(s, d.player, id)) out.push({ kind: 'cast', object: id });
      }
      return out;
    }
    default: return [];
  }
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
  const s = structuredClone(state);
  const refusal = apply(s, d, choice);
  if (refusal) return { refused: refusal };
  s.seq++;
  run(s);
  return s;
}

const wrong = (d: Decision, c: Choice) => `Expected an answer to "${d.kind}", got "${c.kind}"`;

function apply(s: GameState, d: Decision, c: Choice): string | null {
  const p = d.player;
  s.decision = null;
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
      if (bad) { s.decision = d; return bad; }
      for (const id of c.cards) move(s, id, zoneOf(p, 'library'), { bottom: true });
      event(s, `${playerName(s, p)} puts ${d.count} card${d.count > 1 ? 's' : ''} on the bottom of their library`);
      nextMulligan(s, p);
      return null;
    }
    case 'priority': return applyPriority(s, d, c);
    case 'attackers': {
      if (c.kind !== 'attack') return wrong(d, c);
      const bad = checkAttack(s, c.attackers);
      if (bad) { s.decision = d; return bad; }
      declareAttackers(s, c.attackers);
      finishTurnBased(s);
      return null;
    }
    case 'blockers': {
      if (c.kind !== 'block') return wrong(d, c);
      const bad = checkBlocks(s, c.blocks);
      if (bad) { s.decision = d; return bad; }
      declareBlockers(s, c.blocks);
      finishTurnBased(s);
      return null;
    }
    case 'damage': {
      if (c.kind !== 'damage') return wrong(d, c);
      const bad = checkSplit(s, obj(s, d.attacker), c.assign);
      if (bad) { s.decision = d; return bad; }
      s.assignments[d.attacker] = c.assign;
      return null; // the damage step's turn-based action picks up the next split, or deals damage
    }
    case 'discard': {
      if (c.kind !== 'discard') return wrong(d, c);
      const bad = checkCards(s, p, c.cards, d.count);
      if (bad) { s.decision = d; return bad; }
      for (const id of c.cards) {
        event(s, `${playerName(s, p)} discards ${nameOf(s, id)}`);
        move(s, id, zoneOf(p, 'graveyard'));
      }
      return null;
    }
    case 'legend': {
      if (c.kind !== 'legend' || !d.objects.includes(c.keep)) { s.decision = d; return c.kind !== 'legend' ? wrong(d, c) : 'Keep one of the named permanents'; }
      for (const id of d.objects) if (id !== c.keep) { event(s, `${nameOf(s, id)} goes to the graveyard (legend rule)`); move(s, id, zoneOf(obj(s, id).owner, 'graveyard')); }
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

function applyPriority(s: GameState, d: Decision & { kind: 'priority' }, c: Choice): string | null {
  const p = d.player;
  if (c.kind === 'pass') {
    s.passes++;
    if (s.passes < 2) { s.priority = other(p); return null; }
    s.passes = 0;
    if (s.zones.stack.length) { resolveTop(s); s.priority = s.active; } else s.priority = null;
    return null;
  }
  if (c.kind === 'play') {
    const bad = whyNotPlay(s, p, c.object);
    if (bad) { s.decision = d; return bad; }
    event(s, `${playerName(s, p)} plays ${nameOf(s, c.object)}`);
    move(s, c.object, 'battlefield', { controller: p }).controlledSince = s.turn;
    s.players[p].landsPlayed++;
    s.passes = 0;
    return null;
  }
  if (c.kind === 'cast') {
    const bad = whyNotCast(s, p, c.object);
    if (bad) { s.decision = d; return bad; }
    pay(s, p, solvePayment(printed(s, obj(s, c.object)).manaCost, manaSources(s, p))!.sources);
    event(s, `${playerName(s, p)} casts ${nameOf(s, c.object)}`);
    move(s, c.object, 'stack', { controller: p });
    s.passes = 0;
    return null;
  }
  s.decision = d;
  return wrong(d, c);
}

function pay(s: GameState, p: PlayerId, sources: string[]): void {
  for (const id of sources) {
    if (id.startsWith('pool:')) { const c = id.split(':')[1] as Color | 'C'; s.players[p].pool[c]--; }
    else obj(s, id).tapped = true;
  }
}

function resolveTop(s: GameState): void {
  const id = s.zones.stack[s.zones.stack.length - 1]!;
  const o = obj(s, id);
  const permanent = ['Creature', 'Artifact', 'Enchantment', 'Planeswalker', 'Battle'].some((t) => isType(s, o, t));
  event(s, `${nameOf(s, id)} resolves`);
  if (permanent) move(s, id, 'battlefield', { controller: o.controller }).controlledSince = s.turn;
  else move(s, id, zoneOf(o.owner, 'graveyard'));
}

// ---------------------------------------------------------------------------------------------
// Running forward: steps, turn-based actions and priority.

function run(s: GameState): void {
  for (let guard = 0; guard < 10_000; guard++) {
    if (s.result) { s.decision = null; s.priority = null; return; }
    if (s.decision) return;
    if (s.turn === 0) return; // mulligans; their decisions drive the start
    if (s.pendingTurnBased) { turnBased(s); continue; }
    if (s.priority) {
      // 117.5: state-based actions are checked whenever a player would receive priority.
      while (!s.result && !s.decision && stateBasedActions(s)) { /* repeat until none apply */ }
      if (s.result || s.decision) continue;
      s.decision = { kind: 'priority', player: s.priority };
      return;
    }
    advance(s);
  }
  throw new Error('the engine ran 10,000 steps without needing a decision');
}

function advance(s: GameState): void {
  const i = STEPS.indexOf(s.step);
  if (s.step === 'endCombat') endCombat(s);
  if (i === STEPS.length - 1) {
    s.turn++;
    s.active = other(s.active);
    s.players[s.active].landsPlayed = 0;
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

/** Ends the current step's turn-based action and gives priority where the step has it. */
function finishTurnBased(s: GameState): void {
  s.pendingTurnBased = false;
  const noPriority: Step[] = ['untap', 'cleanup'];
  s.priority = noPriority.includes(s.step) ? null : s.active;
}

/** The current step's turn-based action. It may stop on a decision; the answer finishes it, or it runs again. */
function turnBased(s: GameState): void {
  const a = s.active;
  switch (s.step) {
    case 'untap':
      for (const o of controlledBy(s, a)) o.tapped = false;
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
        s.decision = {
          kind: 'damage', player: ask.controller, attacker: ask.id, blockers: [...(ask.blockedBy ?? [])],
          power: characteristics(s, ask).power, trample: characteristics(s, ask).keywords.includes('trample'),
        };
        return; // the UI pre-fills combat.proposedSplit

      }
      dealCombatDamage(s);
      break;
    }
    case 'cleanup': {
      const extra = hand(s, a).length - HAND_SIZE;
      if (extra > 0) { s.decision = { kind: 'discard', player: a, count: extra }; return; }
      for (const o of battlefield(s)) { o.damage = 0; o.deathtouched = false; } // 514.2
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
