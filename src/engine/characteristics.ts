/**
 * Characteristics through the layer system (CR 613). For every object on the battlefield, start
 * from its printed values and apply continuous effects layer by layer, in timestamp order within a
 * layer. Effects come from resolved spells and abilities (with their affected set fixed, 611.2c)
 * and from static abilities (affecting whatever matches now, 611.3a).
 *
 * The one dependency (613.8) the pool needs is handled first: an effect that removes all abilities
 * from an object stops that object's own static abilities from applying at all, whatever the
 * timestamps (Honest Work on a creature whose static ability grants others abilities).
 */
import type { Continuous } from './abilities';
import { amount, holds, objects, type Characteristics, type Context, type View } from './evaluate';
import type { GameObject, GameState, ObjectId } from './types';

export type { Characteristics } from './evaluate';

interface Applied { effect: Continuous; affected: (view: View) => GameObject[]; timestamp: number; ctx: Context; active: (view: View) => boolean }

function printedChars(s: GameState, o: GameObject): Characteristics {
  const p = s.setup.cards[o.card];
  if (!p) throw new Error(`no card data for ${o.card}`);
  return {
    name: p.name, supertypes: [...p.supertypes], types: [...p.types], subtypes: [...p.subtypes],
    power: p.power ?? 0, toughness: p.toughness ?? 0, keywords: p.keywords.map((k) => k.toLowerCase()),
    abilitiesRemoved: false,
  };
}

/** Every continuous effect in force, with what it affects, in timestamp order. */
function effectsInForce(s: GameState, removed: Set<ObjectId>): Applied[] {
  const out: Applied[] = [];
  for (const e of s.effects) {
    const ctx: Context = { controller: e.controller, source: e.source };
    out.push({ effect: e.effect, timestamp: e.timestamp, ctx, active: () => true,
      affected: () => e.affected.flatMap((id) => (s.objects[id]?.zone === 'battlefield' ? [s.objects[id]!] : [])) });
  }
  for (const id of s.zones.battlefield) {
    if (removed.has(id)) continue;
    const src = s.objects[id]!;
    for (const st of s.setup.cards[src.card]?.script?.statics ?? []) {
      const ctx: Context = { controller: src.controller, source: src.id };
      out.push({ effect: st.effect, timestamp: src.timestamp, ctx,
        active: (view) => !st.while || holds(s, view, st.while, ctx),
        affected: (view) => objects(s, view, st.effect.affects, ctx).filter((o) => o.zone === 'battlefield') });
    }
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
}

/** Objects whose abilities are all removed, found before anything else (613.8's one case in the pool). */
function removedAbilities(s: GameState, base: View): Set<ObjectId> {
  const removed = new Set<ObjectId>();
  for (;;) {
    const before = removed.size;
    for (const a of effectsInForce(s, removed)) {
      if (!a.effect.removeAllAbilities || !a.active(base)) continue;
      for (const o of a.affected(base)) removed.add(o.id);
    }
    if (removed.size === before) return removed;
  }
}

/**
 * Everything the layer computation reads that can change within one engine step: what is on the
 * battlefield and the facts filters ask about, graveyards (for counts), the stack, the effects in
 * force and whose turn it is. The engine mutates a
 * private copy of the state, so the cache is keyed by these rather than by the state object alone.
 */
function fingerprint(s: GameState): string {
  let fp = `${s.active}|${s.effects.length}|${s.nextTimestamp}|${s.zones['p1.graveyard'].join()}|${s.zones['p2.graveyard'].join()}|${s.zones.stack.join()}|`;
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    fp += `${id}${o.controller}${o.tapped ? 't' : ''}${o.attacking ?? ''}${o.blocking ? 'b' : ''}${o.attachedTo ?? ''}`;
    for (const k in o.counters) fp += `${k}${o.counters[k]}`;
    fp += ';';
  }
  return fp;
}

const cache = new WeakMap<GameState, { fp: string; map: Map<ObjectId, Characteristics> }>();

/** Characteristics of every object on the battlefield, through all layers. */
export function computeAll(s: GameState): Map<ObjectId, Characteristics> {
  const fp = fingerprint(s);
  const hit = cache.get(s);
  if (hit && hit.fp === fp) return hit.map;
  const map = compute(s);
  cache.set(s, { fp, map });
  return map;
}

function compute(s: GameState): Map<ObjectId, Characteristics> {
  const map = new Map<ObjectId, Characteristics>();
  for (const id of s.zones.battlefield) map.set(id, printedChars(s, s.objects[id]!));
  const view: View = (o) => map.get(o.id) ?? printedChars(s, o);
  const removed = removedAbilities(s, view);
  const effects = effectsInForce(s, removed);
  const each = (pick: (e: Continuous) => boolean, apply: (c: Characteristics, a: Applied) => void) => {
    for (const a of effects) {
      if (!pick(a.effect) || !a.active(view)) continue;
      for (const o of a.affected(view)) { const c = map.get(o.id); if (c) apply(c, a); }
    }
  };
  // Layer 3: text (names).
  each((e) => !!e.setName, (c, a) => { c.name = a.effect.setName!; });
  // Layer 4: type-changing effects.
  each((e) => !!(e.setTypes || e.addTypes || e.addSubtypes), (c, a) => {
    const e = a.effect;
    if (e.setTypes) { c.types = [...e.setTypes.types]; c.subtypes = [...e.setTypes.subtypes]; }
    for (const t of e.addTypes ?? []) if (!c.types.includes(t)) c.types.push(t);
    for (const t of e.addSubtypes ?? []) if (!c.subtypes.includes(t)) c.subtypes.push(t);
  });
  // Layer 6: ability-adding and ability-removing effects, in timestamp order.
  for (const id of removed) { const c = map.get(id); if (c) c.abilitiesRemoved = true; }
  each((e) => !!(e.addKeywords || e.removeAllAbilities), (c, a) => {
    if (a.effect.removeAllAbilities) c.keywords = [];
    for (const k of a.effect.addKeywords ?? []) if (!c.keywords.includes(k)) c.keywords.push(k);
  });
  // Layer 7b: effects that set base power and toughness.
  each((e) => !!e.setBase, (c, a) => { [c.power, c.toughness] = a.effect.setBase!; });
  // Layer 7c: effects that modify power and toughness, and counters.
  each((e) => !!e.modify, (c, a) => {
    c.power += amount(s, view, a.effect.modify![0], a.ctx);
    c.toughness += amount(s, view, a.effect.modify![1], a.ctx);
  });
  for (const [id, c] of map) {
    const o = s.objects[id]!;
    const n = (o.counters['+1/+1'] ?? 0) - (o.counters['-1/-1'] ?? 0);
    c.power += n; c.toughness += n;
  }
  return map;
}

/** All characteristics at once, for code that asks about many objects. Callers must not mutate the results. */
export function view(s: GameState): View {
  const all = computeAll(s);
  return (o) => all.get(o.id) ?? printedChars(s, o);
}

/** An object's current characteristics; outside the battlefield, its printed ones. */
export function characteristics(s: GameState, o: GameObject): Characteristics {
  if (o.zone !== 'battlefield') return printedChars(s, o);
  return computeAll(s).get(o.id) ?? printedChars(s, o);
}

export const isType = (s: GameState, o: GameObject, t: string) => characteristics(s, o).types.includes(t);
export const hasKeyword = (s: GameState, o: GameObject, k: string) => characteristics(s, o).keywords.includes(k);

/**
 * Summoning sickness (CR 302.6): a creature can't attack or use {T} abilities unless its controller
 * has controlled it continuously since the start of their most recent turn. Turns alternate, so
 * that turn is this one on their turn and the one before on the opponent's.
 */
export function summoningSick(s: GameState, o: GameObject): boolean {
  const theirLatestTurn = s.active === o.controller ? s.turn : s.turn - 1;
  return o.controlledSince >= theirLatestTurn && !hasKeyword(s, o, 'haste');
}
