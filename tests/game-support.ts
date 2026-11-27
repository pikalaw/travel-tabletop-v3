/** Test support for whole games: giving a player something to respond with, so their windows open. */
import type { PlayerId } from '../src/engine/types';
import { current, type Game } from '../src/host/controller';
import { ABILITY_CARDS } from './ability-cards';
import { place } from './engine-support';

/**
 * The current state with `p` holding a Shock and an untapped Mountain: with an instant they can
 * cast, their windows open (a player with nothing to do is passed for). Returns the Shock's id.
 */
export function withShock(g: Game, p: PlayerId = 'p2'): [Game, string] {
  let s = structuredClone(current(g));
  s.setup = { ...s.setup, cards: { ...s.setup.cards, ...ABILITY_CARDS } };
  let shock: string[];
  [s] = place(s, p, ['mountain']);
  [s, shock] = place(s, p, ['shock'], 'hand');
  return [{ ...g, states: [...g.states.slice(0, -1), s] }, shock[0]!];
}
