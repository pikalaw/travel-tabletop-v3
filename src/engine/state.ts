/**
 * Low-level state operations. The engine works on a private copy of the state (see engine.ts), so
 * these functions mutate it; nothing outside the engine ever sees a state mid-step.
 */
import { nextInt, shuffle as shuffleWith } from './rng';
import { fire } from './triggers';
import type { CardId, GameObject, GameState, ObjectId, PlayerId, Printed, ZoneId } from './types';

export const zoneOf = (p: PlayerId, z: 'library' | 'hand' | 'graveyard' | 'exile'): ZoneId => `${p}.${z}`;

export function obj(s: GameState, id: ObjectId): GameObject {
  const o = s.objects[id];
  if (!o) throw new Error(`no object ${id}`);
  return o;
}

export function printed(s: GameState, o: GameObject): Printed {
  const p = s.setup.cards[o.card];
  if (!p) throw new Error(`no card data for ${o.card}`);
  return p;
}

export function event(s: GameState, text: string): void {
  s.events.push({ turn: s.turn, text });
}

/** Makes a new object for `card` at the end (top) of `zone`. */
export function createObject(s: GameState, card: CardId, owner: PlayerId, zone: ZoneId): GameObject {
  const o: GameObject = {
    id: `o${s.nextId++}`, card, owner, controller: owner, zone, timestamp: s.nextTimestamp++,
    tapped: false, controlledSince: s.turn, damage: 0, deathtouched: false, counters: {},
  };
  s.objects[o.id] = o;
  s.zones[zone].push(o.id);
  return o;
}

/**
 * Moves an object to another zone. It becomes a new object there (CR 400.7): the old id stops
 * existing, and nothing about the old object carries over but its card and owner. Cards go to
 * their owner's library, hand, graveyard or exile, whatever zone id is given for those.
 */
export function move(s: GameState, id: ObjectId, to: ZoneId, opts: { tapped?: boolean; controller?: PlayerId; bottom?: boolean } = {}): GameObject {
  const o = obj(s, id);
  const from = s.zones[o.zone];
  from.splice(from.indexOf(id), 1);
  delete s.objects[id];
  const dest: ZoneId = to === 'battlefield' || to === 'stack' ? to : zoneOf(o.owner, to.split('.')[1] as 'library');
  const n = createObject(s, o.card, o.owner, dest);
  if (opts.bottom) { s.zones[dest].pop(); s.zones[dest].unshift(n.id); }
  if (dest === 'battlefield' || dest === 'stack') n.controller = opts.controller ?? o.controller;
  n.tapped = !!opts.tapped;
  return n;
}

/** The top card of a library is its last element. */
export function top(s: GameState, p: PlayerId): ObjectId | undefined {
  const lib = s.zones[zoneOf(p, 'library')];
  return lib[lib.length - 1];
}

export function draw(s: GameState, p: PlayerId, n = 1): void {
  for (let i = 0; i < n; i++) {
    const id = top(s, p);
    if (id === undefined) { s.players[p].drewFromEmpty = true; continue; }
    move(s, id, zoneOf(p, 'hand'));
    if (s.turn > 0) { s.turnLog.drawn[p]++; fire(s, { kind: 'drew', player: p, nth: s.turnLog.drawn[p] }); }
  }
}

export function shuffleLibrary(s: GameState, p: PlayerId): void {
  const z = zoneOf(p, 'library');
  const [order, rng] = shuffleWith(s.rng, s.zones[z]);
  s.zones[z] = order;
  s.rng = rng;
}

export function randomInt(s: GameState, n: number): number {
  const [x, rng] = nextInt(s.rng, n);
  s.rng = rng;
  return x;
}

export const battlefield = (s: GameState): GameObject[] => s.zones.battlefield.map((id) => obj(s, id));
export const controlledBy = (s: GameState, p: PlayerId): GameObject[] => battlefield(s).filter((o) => o.controller === p);
