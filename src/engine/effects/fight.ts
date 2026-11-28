import type { ObjectRef } from '../abilities';
import { dealDamage } from './damage';
import type { Handler } from './kit';

/** Each deals damage equal to its power to the other (701.14). */
export interface Fight { fight: [ObjectRef, ObjectRef] }

export const fight: Handler<Fight> = (e, r) => {
  const [a] = r.objs(e.fight[0]), [b] = r.objs(e.fight[1]);
  // 701.14b: if either is no longer a creature on the battlefield, no damage is dealt.
  if (!a || !b || !r.v(a).types.includes('Creature') || !r.v(b).types.includes('Creature')) return;
  const pa = r.v(a).power, pb = r.v(b).power;
  dealDamage(r.s, a.id, b.id, pa);
  dealDamage(r.s, b.id, a.id, pb);
};
