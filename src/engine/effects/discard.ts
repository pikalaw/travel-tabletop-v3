import type { Amount, PlayerRef } from '../abilities';
import { move, zoneOf } from '../state';
import type { Handler } from './kit';

/** "Discard N cards": the player chooses, unless it's their whole hand. */
export interface Discard { discard: PlayerRef; n: Amount }

export const discard: Handler<Discard> = (e, r) => {
  const [p] = r.players(e.discard);
  if (!p) return;
  const hand = r.s.zones[zoneOf(p, 'hand')];
  const k = Math.min(r.n(e.n), hand.length);
  let cards = hand.slice(0, k);
  if (k > 0 && k < hand.length) {
    const picked = r.answer('pick');
    if (!picked) return r.ask({ kind: 'pick', player: p, from: [...hand], options: [...hand], min: k, max: k, text: `Discard ${k === 1 ? 'a card' : `${k} cards`}`, done: 'Discard' });
    cards = picked.cards;
  }
  for (const id of cards) { r.log(`${r.playerName(p)} discards ${r.cardName(id)}`); move(r.s, id, zoneOf(p, 'graveyard')); }
};
