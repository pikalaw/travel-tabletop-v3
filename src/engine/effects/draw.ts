import type { Amount, PlayerRef } from '../abilities';
import { draw as drawCards } from '../state';
import type { Handler } from './kit';

/** "Draw N cards." */
export interface Draw { draw: PlayerRef; n: Amount }

export const draw: Handler<Draw> = (e, r) => {
  for (const p of r.players(e.draw)) {
    const k = r.n(e.n);
    drawCards(r.s, p, k);
    r.log(`${r.playerName(p)} draws ${k === 1 ? 'a card' : `${k} cards`}`);
  }
};
