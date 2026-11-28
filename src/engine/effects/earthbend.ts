import type { Amount, ObjectRef } from '../abilities';
import { addCounters } from '../zones';
import type { Handler } from './kit';

/** Earthbend N (701.65): the land becomes a 0/0 creature with haste that's still a land, gets N +1/+1 counters, and returns tapped when it dies or is exiled. */
export interface Earthbend { earthbend: Amount; on: ObjectRef }

export const earthbend: Handler<Earthbend> = (e, r) => {
  for (const o of r.objs(e.on)) {
    r.addEffect({ addTypes: ['Creature'], setBase: [0, 0], addKeywords: ['haste'], earthbent: true }, [o.id], 'permanent');
    r.log(`${r.v(o).name} is earthbent`);
    addCounters(r.s, o.id, '+1/+1', r.n(e.earthbend), r.ctx.controller);
  }
};
