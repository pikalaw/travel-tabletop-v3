import type { ObjectRef } from '../abilities';
import { leaveBattlefield } from '../zones';
import type { Handler } from './kit';

/** Airbend (701.66): exile it; while exiled, its owner may cast it for {2}. A token airbended ceases to exist. */
export interface Airbend { airbend: ObjectRef }

export const airbend: Handler<Airbend> = (e, r) => {
  for (const o of r.objs(e.airbend)) {
    r.log(`${r.v(o).name} is airbent`);
    for (const id of leaveBattlefield(r.s, [o.id], 'exile')) r.s.objects[id]!.airbended = true;
  }
};
