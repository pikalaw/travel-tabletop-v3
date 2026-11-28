import type { ObjectRef, TriggeredAbility } from '../abilities';
import { holds } from '../evaluate';
import { DELAYED } from '../triggers';
import type { Handler, Resolution } from './kit';

/**
 * A delayed triggered ability (603.7): "When that creature dies this turn, you earthbend 4". It
 * watches for its event from now on, about `about` if given, until the end of the turn with
 * `thisTurn`; it triggers once.
 */
export interface Delayed { delayed: TriggeredAbility; about?: ObjectRef; thisTurn?: boolean }

/** A reflexive triggered ability (603.12): "When you do, …". It triggers at once, if its `if` holds. */
export interface Reflexive { reflexive: Omit<TriggeredAbility, 'when'> }

const base = (r: Resolution) => {
  const src = r.s.objects[r.ctx.source];
  return { controller: r.ctx.controller, source: r.ctx.source, sourceName: src ? r.v(src).name : 'An ability', card: src?.card ?? r.s.resolving!.source };
};

export const delayed: Handler<Delayed> = (e, r) => {
  const about = e.about ? r.objs(e.about)[0]?.id : undefined;
  if (e.about && !about) return; // what it would watch is gone
  r.s.delayed.push({ ability: e.delayed, ...base(r), ...(about ? { about } : {}), ...(e.thisTurn ? { untilTurn: r.s.turn } : {}) });
};

export const reflexive: Handler<Reflexive> = (e, r) => {
  if (e.reflexive.if && !holds(r.s, r.v, e.reflexive.if, r.ctx)) return;
  const b = base(r);
  r.s.delayed.push({ ability: { ...e.reflexive, when: { reflexive: true } }, ...b, done: true });
  r.s.pendingTriggers.push({ ...b, index: DELAYED + r.s.delayed.length - 1 });
};
