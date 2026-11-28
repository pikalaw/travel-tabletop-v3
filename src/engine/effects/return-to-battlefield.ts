import type { ObjectRef } from '../abilities';
import { putOntoBattlefield } from '../zones';
import type { Handler } from './kit';

/** "Return it to the battlefield (tapped) under your control." */
export interface ReturnToBattlefield { returnToBattlefield: ObjectRef; tapped?: boolean }

export const returnToBattlefield: Handler<ReturnToBattlefield> = (e, r) => {
  for (const o of r.objs(e.returnToBattlefield)) {
    if (o.zone === 'battlefield' || o.zone === 'stack') continue;
    r.log(`${r.cardName(o.id)} returns to the battlefield`);
    putOntoBattlefield(r.s, o.id, r.ctx.controller, { tapped: !!e.tapped });
  }
};
