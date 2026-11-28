import type { ObjectRef } from '../abilities';
import { dealDamage } from './damage';
import type { Handler } from './kit';

/** "Each deals damage equal to its power to …" (Allies at Last). */
export interface EachDeals { eachDeals: ObjectRef; to: ObjectRef }

export const eachDeals: Handler<EachDeals> = (e, r) => {
  const [to] = r.objs(e.to);
  if (!to) return;
  for (const o of r.objs(e.eachDeals)) dealDamage(r.s, o.id, to.id, r.v(o).power);
};
