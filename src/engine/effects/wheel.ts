import type { PlayerRef } from '../abilities';
import { draw, zoneOf } from '../state';
import { discardCard } from '../zones';
import type { Handler } from './kit';

/** "Each player discards all the cards in their hand, then draws that many cards minus one" (Dark Deal). */
export interface DiscardHandDraw { discardHandDraw: PlayerRef; minus: number }

export const discardHandDraw: Handler<DiscardHandDraw> = (e, r) => {
  const players = r.players(e.discardHandDraw);
  const counts = players.map((p) => { const hand = [...r.s.zones[zoneOf(p, 'hand')]]; for (const id of hand) discardCard(r.s, p, id); return hand.length; });
  players.forEach((p, i) => {
    const k = Math.max(0, counts[i]! - e.minus);
    draw(r.s, p, k);
    r.log(`${r.playerName(p)} draws ${k === 1 ? 'a card' : `${k} cards`}`);
  });
};
