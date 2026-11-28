import type { ObjectRef } from '../abilities';
import type { Handler } from './kit';

/** Attach this Aura or Equipment to an object (701.3). */
export interface Attach { attach: ObjectRef }

export const attach: Handler<Attach> = (e, r) => {
  const [to] = r.objs(e.attach);
  const self = r.s.objects[r.ctx.source];
  if (!to || !self || self.zone !== 'battlefield' || to.zone !== 'battlefield') return;
  self.attachedTo = to.id;
  r.log(`${r.v(self).name} is attached to ${r.v(to).name}`);
};
