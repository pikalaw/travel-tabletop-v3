import type { Amount, ObjectRef } from '../abilities';
import { countersOf } from '../evaluate';
import { addCounters as add } from '../zones';
import type { Handler } from './kit';

export interface AddCounters { addCounters: string; n: Amount; on: ObjectRef }
export interface RemoveCounters { removeCounters: string; n: Amount; on: ObjectRef }
/** "Remove up to N counters from it": the most of any kinds, +1/+1 first (the controller's choice; the pool's one use is a removal spell). */
export interface RemoveAnyCounters { removeAnyCounters: number; on: ObjectRef }
/** "Put its counters on …": every counter the object had, as it last existed. */
export interface PutCountersOf { putCountersOf: ObjectRef; on: ObjectRef }

export const addCounters: Handler<AddCounters> = (e, r) => {
  for (const o of r.objs(e.on)) add(r.s, o.id, e.addCounters, r.n(e.n));
};

export const removeCounters: Handler<RemoveCounters> = (e, r) => {
  for (const o of r.objs(e.on)) o.counters[e.removeCounters] = Math.max(0, (o.counters[e.removeCounters] ?? 0) - r.n(e.n));
};

export const removeAnyCounters: Handler<RemoveAnyCounters> = (e, r) => {
  for (const o of r.objs(e.on)) {
    let left = e.removeAnyCounters;
    for (const k of Object.keys(o.counters).sort((a, b) => Number(b === '+1/+1') - Number(a === '+1/+1'))) {
      const take = Math.min(left, o.counters[k] ?? 0);
      o.counters[k] = (o.counters[k] ?? 0) - take;
      left -= take;
    }
  }
};

export const putCountersOf: Handler<PutCountersOf> = (e, r) => {
  const all = countersOf(r.s, r.v, e.putCountersOf, r.ctx);
  for (const o of r.objs(e.on)) for (const c of all) for (const [kind, k] of Object.entries(c)) add(r.s, o.id, kind, k);
};
