import type { Filter } from '../abilities';
import { select } from '../evaluate';
import { addCounters } from '../zones';
import type { Handler } from './kit';

/** "Distribute three stun counters among any number of tapped creatures your opponents control." */
export interface DistributeCounters { distributeCounters: string; n: number; among: Filter }

export const distributeCounters: Handler<DistributeCounters> = (e, r) => {
  const options = select(r.s, r.v, e.among, r.ctx).map((o) => o.id);
  if (!options.length) return;
  let split: Record<string, number> = { [options[0]!]: e.n };
  if (options.length > 1) {
    const answer = r.answer('distribute');
    if (!answer) return r.ask({ kind: 'distribute', player: r.ctx.controller, options, total: e.n, text: `Distribute ${e.n} ${e.distributeCounters} counters` });
    split = answer.amounts;
  }
  for (const [id, k] of Object.entries(split)) if (k > 0) addCounters(r.s, id, e.distributeCounters, k, r.ctx.controller);
};
