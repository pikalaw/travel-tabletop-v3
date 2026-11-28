/**
 * Entering and leaving the battlefield, where replacement effects (614) and the matching events
 * attach. Every engine path that puts a permanent onto the battlefield or takes one off goes
 * through here, so "enters tapped", "if it would die, exile it instead" and dies-triggers work the
 * same whatever caused them.
 *
 * Competing replacements: 616.1 lets the affected player order them. In this pool no two that can
 * apply to one event give different results in different orders (on other objects there are only
 * Solid Ground and Animal Attendant, whose extra counters add up in any order, Combustion
 * Technique's "exile instead" and stun counters), so they apply in a fixed order: the object's own
 * (self-replacement, 616.1a), then the rest by timestamp.
 */
import { view } from './characteristics';
import { matches, type Context } from './evaluate';
import { createObject, event, move, zoneOf } from './state';
import { EARTHBEND_RETURN, fire } from './triggers';
import type { GameObject, GameState, ObjectId, PlayerId } from './types';

/** Puts an object (from any zone) onto the battlefield, as a new object (400.7). */
export function putOntoBattlefield(s: GameState, id: ObjectId, controller: PlayerId, opts: EnterOptions = {}): ObjectId {
  return entered(s, move(s, id, 'battlefield', { controller }), opts);
}

/** Creates a token on the battlefield (111.1). */
export function createToken(s: GameState, card: string, controller: PlayerId, opts: { tapped?: boolean } = {}): ObjectId {
  if (!s.setup.cards[card]) throw new Error(`no token data for ${card}`);
  return entered(s, createObject(s, card, controller, 'battlefield'), opts);
}

/** How a permanent enters: tapped, attached, or with extra counters (Animal Attendant's mana). */
interface EnterOptions { tapped?: boolean; attachTo?: ObjectId; counters?: Record<string, number>; castWith?: number }

/** What happens as a permanent enters: its own entering replacements (614.1c-d), then the event. */
function entered(s: GameState, o: GameObject, opts: EnterOptions): ObjectId {
  const reps = s.setup.cards[o.card]?.script?.replacements ?? [];
  if (opts.attachTo) o.attachedTo = opts.attachTo; // an Aura enters attached (303.4f)
  if (opts.castWith !== undefined) o.castWith = opts.castWith;
  o.tapped = !!opts.tapped || reps.some((r) => 'entersTapped' in r.replace);
  o.controlledSince = s.turn;
  if (view(s)(o).types.includes('Land')) s.turnLog.landsEntered[o.controller]++;
  // Entering with counters is counters being put on it, so "that many plus one" applies too.
  for (const r of reps) if ('entersWithCounters' in r.replace) addCounters(s, o.id, r.replace.entersWithCounters, r.replace.n);
  for (const [kind, n] of Object.entries(opts.counters ?? {})) addCounters(s, o.id, kind, n);
  // 714.3a: as a Saga enters, its controller puts a lore counter on it.
  if (view(s)(o).subtypes.includes('Saga')) addCounters(s, o.id, 'lore', 1, o.controller);
  fire(s, { kind: 'enters', object: o.id });
  return o.id;
}

const isToken = (s: GameState, id: ObjectId) => !!s.setup.cards[s.objects[id]!.card]?.token;

/**
 * Takes permanents off the battlefield at once. Leave and dies triggers are collected first, while
 * the objects and their abilities still exist (603.10a). A creature that would die is exiled
 * instead if an effect says so (614). Tokens that leave cease to exist (111.7, 704.5d).
 */
export function leaveBattlefield(s: GameState, ids: ObjectId[], to: 'graveyard' | 'exile' | 'hand' | 'library', why: { dies?: boolean } = {}): ObjectId[] {
  const v = view(s);
  const live = ids.filter((id) => s.objects[id]?.zone === 'battlefield');
  const dest = new Map<ObjectId, 'graveyard' | 'exile' | 'hand' | 'library'>();
  for (const id of live) {
    const o = s.objects[id]!;
    const dies = to === 'graveyard' && (why.dies ?? v(o).types.includes('Creature'));
    const exileInstead = dies && s.effects.some((e) => e.effect.exileIfWouldDie && e.affected.includes(id));
    dest.set(id, exileInstead ? 'exile' : to);
    fire(s, { kind: exileInstead || !dies ? 'leaves' : 'dies', object: id });
    if (!exileInstead && to === 'graveyard') fire(s, { kind: 'toGraveyard', object: id });
  }
  const out: ObjectId[] = [];
  for (const id of live) {
    const o = s.objects[id]!;
    const d = dest.get(id)!;
    const token = isToken(s, id);
    const earthbent = s.effects.find((e) => e.effect.earthbent && e.affected.includes(id));
    const name = v(o).name;
    const n = move(s, id, zoneOf(o.owner, d));
    s.lastKnown[id] = { counters: { ...o.counters }, movedTo: n.id };
    if (token) { s.zones[n.zone].splice(s.zones[n.zone].indexOf(n.id), 1); delete s.objects[n.id]; continue; }
    // 701.65: an earthbent land that dies or is exiled comes back, by a triggered ability of its earthbending.
    if (earthbent && (d === 'graveyard' || d === 'exile')) {
      s.pendingTriggers.push({ controller: earthbent.controller, source: n.id, sourceName: name, card: n.card, index: EARTHBEND_RETURN, eventObject: n.id });
    }
    out.push(n.id);
  }
  // Auras and Equipment attached to something that left: Auras go to the graveyard as a
  // state-based action; Equipment stays, unattached (704.5m, 704.5n).
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    if (o.attachedTo && !s.objects[o.attachedTo]) delete o.attachedTo;
  }
  return out;
}

/** Puts counters on a permanent, with "that many plus one" replacements (Solid Ground). `by`: the player whose effect puts them. */
export function addCounters(s: GameState, id: ObjectId, kind: string, n: number, by?: PlayerId): void {
  const o = s.objects[id];
  if (!o || n <= 0) return;
  const v = view(s);
  let total = n;
  for (const srcId of s.zones.battlefield) {
    const src = s.objects[srcId]!;
    if (v(src).abilitiesRemoved) continue;
    for (const r of s.setup.cards[src.card]?.script?.replacements ?? []) {
      const rep = r.replace;
      if (!('moreCounters' in rep) || rep.moreCounters !== kind) continue;
      const ctx: Context = { controller: src.controller, source: src.id };
      if (matches(s, v, o, rep.on, ctx)) total += rep.extra;
    }
  }
  o.counters[kind] = (o.counters[kind] ?? 0) + total;
  event(s, `${v(o).name} gets ${total} ${kind} counter${total > 1 ? 's' : ''}`);
  fire(s, { kind: 'countersPut', object: id, counter: kind, n: total, player: by ?? o.controller });
}

/** Taps a permanent, reporting it for "becomes tapped" triggers. */
export function tap(s: GameState, id: ObjectId): void {
  const o = s.objects[id];
  if (!o || o.tapped) return;
  o.tapped = true;
  s.turnLog.tapped[id] = (s.turnLog.tapped[id] ?? 0) + 1;
  fire(s, { kind: 'becomesTapped', object: id });
}
