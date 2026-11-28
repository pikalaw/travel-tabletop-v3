/**
 * Paying mana costs (601.2g–h): what a player can pay with (floating mana, mana sources, and for
 * waterbend their artifacts and creatures), the solver's answer for a cost, and paying it. Players
 * never tap lands by hand: the engine pays, and the UI previews what a payment will tap.
 */
import type { Effect } from './abilities';
import { characteristics, isType, summoningSick, view } from './characteristics';
import { amount, holds, matches, type Context } from './evaluate';
import { parseCost, solvePayment, type ManaSource } from './mana';
import { activatedOf, controlledBy, event, obj, printed, spellOf } from './state';
import type { Choice, Color, GameState, ManaSymbol, ObjectId, PlayerId } from './types';
import { COLORS } from './types';
import { costReduction } from './costs';
import { tap } from './zones';

const BASIC_MANA: Record<string, Color> = { Plains: 'W', Island: 'U', Swamp: 'B', Mountain: 'R', Forest: 'G' };
const playerName = (s: GameState, p: PlayerId) => s.setup.players[p].name;
const nameOf = (s: GameState, id: ObjectId) => characteristics(s, obj(s, id)).name;

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
  // A granted "{T}: Add …" (Great Divide Guide, Tectonic Split, Princess Yue's Moon).
  if (c.addsMana) { scripted.push(...c.addsMana.makes); n = Math.max(n, c.addsMana.n ?? 1); }
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
export function costToPay(s: GameState, p: PlayerId, mana: ManaSymbol[], waterbend = 0, source?: ObjectId, tapsSource = false) {
  const cost: ManaSymbol[] = waterbend ? [...mana, { kind: 'generic', amount: waterbend }] : mana;
  const all = manaSources(s, p, { waterbend: waterbend > 0 }).filter((m) => !(tapsSource && (m.id === source || m.id === `wb:${source}`)));
  const own = all.filter((m) => m.id === `wb:${source}`);
  const sources = [...all.filter((m) => m.id !== `wb:${source}`), ...own];
  const plain = solvePayment(cost, sources);
  if (plain) return plain;
  // A "{1}: Add one mana of any color" ability (Barrels of Blasting Jelly), or "{1}, {T}: …"
  // (Rumble Arena), turns one other mana into any colour: try each source in turn as the one
  // spent on it. A converter that taps can't also make its own mana.
  for (const conv of converters(s, p)) {
    const usable = conv.taps ? sources.filter((m) => m.id.split('#')[0] !== conv.id && m.id !== `wb:${conv.id}`) : sources;
    for (let i = 0; i < usable.length; i++) {
      const m = usable[i]!;
      if (m.genericOnly || m.id === conv.id) continue;
      const via: ManaSource = { id: `via:${conv.id}:${conv.index}>${m.id}`, makes: [...COLORS], ...(m.floating ? { floating: true } : {}) };
      const got = solvePayment(cost, usable.map((x, j) => (j === i ? via : x)));
      if (got) return got;
    }
  }
  return null;
}

/** Permanents with a usable "{1}: Add one mana of any color" ability: once each turn, or by tapping. */
function converters(s: GameState, p: PlayerId): { id: ObjectId; index: number; taps: boolean }[] {
  const out: { id: ObjectId; index: number; taps: boolean }[] = [];
  for (const o of controlledBy(s, p)) {
    if (characteristics(s, o).abilitiesRemoved) continue;
    activatedOf(s, o.id).forEach((a, index) => {
      const any = a.effects.some((e) => 'addMana' in e && e.anyColor);
      if (!a.mana || !any || a.cost.mana !== '{1}') return;
      if (a.cost.tap ? o.tapped || (isType(s, o, 'Creature') && summoningSick(s, o)) : !a.oncePerTurn || s.activatedThisTurn[`${o.id}:${index}`]) return;
      out.push({ id: o.id, index, taps: !!a.cost.tap });
    });
  }
  return out;
}

export function pay(s: GameState, p: PlayerId, sources: string[]): void {
  const tapped = new Map<ObjectId, number>();
  for (let id of sources) {
    if (id.startsWith('via:')) {
      // The mana from this source pays the converter's {1}; the converter makes the colour needed.
      const [conv, inner] = id.slice(4).split('>') as [string, string];
      s.activatedThisTurn[conv] = (s.activatedThisTurn[conv] ?? 0) + 1;
      const [convId, index] = conv.split(':') as [string, string];
      if (activatedOf(s, convId)[Number(index)]?.cost.tap) tap(s, convId);
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

/**
 * The payment for casting a card now: its mana cost, or {2} from airbending exile (701.66), plus any
 * additional cost: a waterbend, or the mana of the additional-cost option chosen (`option`).
 */
export function spellPayment(s: GameState, p: PlayerId, id: ObjectId, x = 0, option?: number) {
  const o = obj(s, id);
  const printedCost = o.zone.endsWith('.exile') && o.airbended ? parseCost('{2}') : printed(s, o).manaCost;
  // 107.3: X is paid as the chosen number.
  const cost = printedCost.map((m): ManaSymbol => (m.kind === 'x' ? { kind: 'generic', amount: x } : m));
  const spell = spellOf(s, id);
  const extra = spell?.additionalCost;
  // 601.2f: reductions, the spell's own and static abilities', take off generic mana only.
  let off = (spell?.reduceBy !== undefined ? amount(s, view(s), spell.reduceBy, { controller: p, source: id }) : 0) + costReduction(s, p, id);
  const reduced = cost.map((m): ManaSymbol => { if (m.kind !== 'generic' || off <= 0) return m; const take = Math.min(off, m.amount); off -= take; return { kind: 'generic', amount: m.amount - take }; });
  const extraMana = [extra?.mana, option !== undefined ? spell?.costOptions?.[option]?.cost.mana : undefined].filter((m): m is string => !!m);
  return costToPay(s, p, [...reduced, ...extraMana.flatMap(parseCost)], extra?.waterbend ?? 0);
}

/** Mana with a rider spent on this spell (Animal Attendant): the counters its permanent enters with. */
export function riderCounters(s: GameState, sources: string[], spell: ObjectId): Record<string, number> {
  const out: Record<string, number> = {};
  for (const src of new Set(sources.map((id) => id.split('#')[0]!))) {
    if (!s.objects[src]) continue;
    for (const a of activatedOf(s, src)) {
      if (!a.mana || !a.rider) continue;
      const ctx = { controller: s.objects[spell]!.controller, source: src };
      if (matches(s, view(s), s.objects[spell]!, { ...a.rider.spentOn, zone: 'stack' }, ctx)) out[a.rider.counter] = (out[a.rider.counter] ?? 0) + 1;
    }
  }
  return out;
}

/**
 * What a cast or an activation would spend, for the confirm step: the permanents it taps (for mana,
 * waterbend or a converter) and the floating mana it uses. Null if it can't be paid.
 */
export function paymentPreview(s: GameState, p: PlayerId, c: Choice): { tapped: ObjectId[]; floating: number; converted: boolean } | null {
  let pay: { sources: string[] } | null = null;
  if (c.kind === 'cast') pay = s.objects[c.object] ? spellPayment(s, p, c.object, c.x ?? 0, c.cost) : null;
  else if (c.kind === 'activate') {
    const a = s.objects[c.object] ? activatedOf(s, c.object)[c.ability] : undefined;
    if (!a) return null;
    pay = a.cost.mana || a.cost.waterbend ? costToPay(s, p, parseCost(a.cost.mana ?? ''), a.cost.waterbend, c.object, !!a.cost.tap) : { sources: [] };
  }
  if (!pay) return null;
  const tapped = new Set<ObjectId>();
  let floating = 0, converted = false;
  for (const id of pay.sources) {
    if (id.startsWith('via:')) converted = true;
    const inner = id.startsWith('via:') ? id.split('>')[1]! : id;
    if (inner.startsWith('pool:') || inner.startsWith('combat:')) floating++;
    else tapped.add((inner.startsWith('wb:') ? inner.slice(3) : inner).split('#')[0]!);
  }
  return { tapped: [...tapped], floating, converted };
}
