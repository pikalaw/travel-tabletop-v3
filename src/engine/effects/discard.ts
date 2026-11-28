import type { Amount, PlayerRef } from '../abilities';
import { zoneOf } from '../state';
import { discardCard } from '../zones';
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
  const discarded: string[] = [];
  for (const id of cards) discarded.push(discardCard(r.s, p, id));
  r.s.resolving!.discarded = discarded; // "when you discard a nonland card this way"
};
