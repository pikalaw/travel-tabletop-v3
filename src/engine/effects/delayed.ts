import type { Condition, ObjectRef, TriggeredAbility } from '../abilities';
import { holds } from '../evaluate';
import { DELAYED } from '../triggers';
import type { Handler, Resolution } from './kit';

/**
 * A delayed triggered ability (603.7): "When that creature dies this turn, you earthbend 4". It
 * watches for its event from now on, about `about` if given, until the end of the turn with
 * `thisTurn`, and then it triggers once. "Until your next turn, whenever …" (`untilYourNextTurn`)
 * triggers every time until its controller's next turn begins.
 */
export interface Delayed { delayed: TriggeredAbility; about?: ObjectRef; thisTurn?: boolean; untilYourNextTurn?: boolean }

/**
 * A reflexive triggered ability (603.12): "When you do, …". It triggers at once, when `provided`
 * holds ("when you discard a nonland card this way"); an `if` in it is intervening, checked again
 * on resolution ("if it has four or more quest counters").
 */
export interface Reflexive { reflexive: Omit<TriggeredAbility, 'when'>; provided?: Condition }

const base = (r: Resolution) => {
  const src = r.s.objects[r.ctx.source];
  return { controller: r.ctx.controller, source: r.ctx.source, sourceName: src ? r.v(src).name : 'An ability', card: src?.card ?? r.s.resolving!.source };
};

export const delayed: Handler<Delayed> = (e, r) => {
  const about = e.about ? r.objs(e.about)[0]?.id : undefined;
  if (e.about && !about) return; // what it would watch is gone
  // Turns alternate: the controller's next turn is two away on their own turn, one on the opponent's.
  const lastTurn = e.thisTurn ? r.s.turn : e.untilYourNextTurn ? r.s.turn + (r.s.active === r.ctx.controller ? 1 : 0) : undefined;
  r.s.delayed.push({ ability: e.delayed, ...base(r), ...(about ? { about } : {}), ...(lastTurn !== undefined ? { untilTurn: lastTurn } : {}), ...(e.untilYourNextTurn ? { repeats: true } : {}) });
};

export const reflexive: Handler<Reflexive> = (e, r) => {
  if (e.provided && !holds(r.s, r.v, e.provided, r.ctx)) return;
  if (e.reflexive.if && !holds(r.s, r.v, e.reflexive.if, r.ctx)) return;
  const b = base(r);
  r.s.delayed.push({ ability: { ...e.reflexive, when: { reflexive: true } }, ...b, done: true });
  r.s.pendingTriggers.push({ ...b, index: DELAYED + r.s.delayed.length - 1 });
};
