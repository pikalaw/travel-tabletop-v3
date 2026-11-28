import data from './cards.json';
import type { CardPool, CardPrinting } from './types';

/** The bundled card pool: every packet, card printing, token and ruling (see scripts/build-cards.ts). */
export const pool: CardPool = data as CardPool;

/** A printing by its id; throws for an id the pool doesn't have, which is always a bug. */
export function printing(id: string): CardPrinting {
  const card = pool.cards[id];
  if (!card) throw new Error(`no card with id ${id} in the pool`);
  return card;
}
