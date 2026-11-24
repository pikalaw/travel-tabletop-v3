/**
 * An object's current characteristics. M1 has printed values plus +1/+1 and −1/−1 counters; the
 * layer system (M2) replaces the body of `characteristics` without changing its callers.
 */
import { printed } from './state';
import type { GameObject, GameState } from './types';

export interface Characteristics {
  name: string;
  supertypes: string[];
  types: string[];
  subtypes: string[];
  power: number;
  toughness: number;
  keywords: string[];
}

export function characteristics(s: GameState, o: GameObject): Characteristics {
  const p = printed(s, o);
  const plus = o.counters['+1/+1'] ?? 0;
  const minus = o.counters['-1/-1'] ?? 0;
  return {
    name: p.name, supertypes: p.supertypes, types: p.types, subtypes: p.subtypes,
    power: (p.power ?? 0) + plus - minus, toughness: (p.toughness ?? 0) + plus - minus,
    keywords: p.keywords.map((k) => k.toLowerCase()),
  };
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
