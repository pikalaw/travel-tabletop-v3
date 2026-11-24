import type { CardId, GameSetup, PlayerId, Printed } from '../engine/types';
import { pool } from './pool';
import { printedOf } from './printed';
import { scripts } from './registry';

/** Printed characteristics with scripts for the given printings and every token. */
export function cardData(ids: Iterable<CardId>): Record<CardId, Printed> {
  const out: Record<CardId, Printed> = {};
  for (const id of new Set([...ids, ...pool.tokens])) {
    const c = pool.cards[id];
    if (!c) throw new Error(`no card ${id} in the pool`);
    const script = scripts.get(c.oracleId);
    out[id] = { ...printedOf(c), ...(script ? { script } : {}), ...(c.token ? { token: true } : {}) };
  }
  return out;
}

/** A game between two players, each with three packets. */
export function gameSetup(players: Record<PlayerId, { name: string; packets: string[] }>, first: PlayerId): GameSetup {
  const deck = (ids: string[]) => ids.flatMap((id) => {
    const p = pool.packets.find((x) => x.id === id);
    if (!p) throw new Error(`no packet ${id}`);
    return p.cards;
  });
  const decks = { p1: deck(players.p1.packets), p2: deck(players.p2.packets) };
  return {
    players: { p1: { name: players.p1.name, deck: decks.p1 }, p2: { name: players.p2.name, deck: decks.p2 } },
    cards: cardData([...decks.p1, ...decks.p2]), first,
  };
}
