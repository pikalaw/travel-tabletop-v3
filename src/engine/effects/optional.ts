import type { Filter } from '../abilities';
import type { Effect } from '.';
import { select } from '../evaluate';
import { zoneOf } from '../state';
import { discardCard, sacrifice as sacrificePermanents } from '../zones';
import type { Handler } from './kit';

/** "You may sacrifice a creature or artifact. If you do, …" / "You may discard a card. If you do, …" */
export interface Optional { optional: { sacrifice?: Filter; discard?: number }; then: Effect[] }

export const optional: Handler<Optional> = (e, r) => {
  const { s, v, ctx } = r;
  const p = ctx.controller;
  const sacrifice = e.optional.sacrifice;
  const count = sacrifice ? 1 : e.optional.discard ?? 1;
  const options = sacrifice ? select(s, v, { ...sacrifice, controller: 'you' }, ctx).map((o) => o.id) : [...s.zones[zoneOf(p, 'hand')]];
  if (options.length < count) return; // can't pay, so can't do it
  const picked = r.answer('pick');
  if (!picked) {
    const what = sacrifice ? 'sacrifice a permanent' : `discard ${count > 1 ? `${count} cards` : 'a card'}`;
    return r.ask({ kind: 'pick', player: p, from: options, options, min: count, max: count, orNone: true, text: `You may ${what}`, done: sacrifice ? 'Sacrifice' : 'Discard', none: "Don't" });
  }
  if (!picked.cards.length) return;
  // The power of what's sacrificed, as it last existed, is "the sacrificed creature's power".
  s.resolving!.chosen = picked.cards;
  if (sacrifice) { for (const id of picked.cards) r.log(`${r.playerName(p)} sacrifices ${r.cardName(id)}`); sacrificePermanents(s, picked.cards, p); }
  else for (const id of picked.cards) discardCard(s, p, id);
  r.then(e.then);
};
