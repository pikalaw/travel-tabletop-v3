import type { Continuous, ObjectRef } from '../abilities';
import { putOntoBattlefield } from '../zones';
import type { Handler } from './kit';

/** "Return it to the battlefield (tapped) under your control", and `as` how it returns ("She's a land named Moon"). */
export interface ReturnToBattlefield { returnToBattlefield: ObjectRef; tapped?: boolean; as?: Omit<Continuous, 'affects'> }

export const returnToBattlefield: Handler<ReturnToBattlefield> = (e, r) => {
  for (const o of r.objs(e.returnToBattlefield)) {
    if (o.zone === 'battlefield' || o.zone === 'stack') continue;
    r.log(`${r.cardName(o.id)} returns to the battlefield`);
    const id = putOntoBattlefield(r.s, o.id, r.ctx.controller, { tapped: !!e.tapped });
    if (e.as) r.addEffect(e.as, [id], 'permanent');
  }
};
