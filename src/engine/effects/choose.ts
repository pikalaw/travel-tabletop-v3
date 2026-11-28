import type { Amount, Filter } from '../abilities';
import type { Effect } from '.';
import { select } from '../evaluate';
import type { Handler } from './kit';

/**
 * "Sacrifice a land", "untap up to three lands": the controller chooses objects matching the
 * filter (exactly `n`, or up to `n`), then `then` runs with them as 'chosen'. With no real choice
 * (as many as needed, or none), nothing is asked.
 */
export interface Choose { choose: Filter; n: Amount; upTo?: boolean; text: string; then: Effect[] }

export const choose: Handler<Choose> = (e, r) => {
  const { s, v, ctx } = r;
  const options = select(s, v, e.choose, ctx).map((o) => o.id);
  const n = Math.min(r.n(e.n), options.length);
  let chosen: string[];
  if (!e.upTo && options.length === n) chosen = options;
  else {
    const picked = r.answer('pick');
    if (!picked) return r.ask({ kind: 'pick', player: ctx.controller, from: options, options, min: e.upTo ? 0 : n, max: n, text: e.text });
    chosen = picked.cards;
  }
  s.resolving!.chosen = chosen;
  r.then(e.then);
};
