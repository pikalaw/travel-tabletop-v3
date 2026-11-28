import type { Filter } from '../abilities';
import { matches } from '../evaluate';
import { zoneOf } from '../state';
import type { Handler } from './kit';

/**
 * "You may cast a noncreature spell from your hand without paying its mana cost" (608.2g): the
 * player picks one and casts it now, choosing its modes and targets, or casts nothing. The cast
 * itself is the answer to the decision (engine.ts, `castFree`).
 */
export interface CastFromHand { castFromHand: Filter }

export const castFromHand: Handler<CastFromHand> = (e, r) => {
  const { s, v, ctx } = r;
  const p = ctx.controller;
  if (r.s.resolving!.castFreeAnswered) return; // the spell was cast, or none
  // Lands are played, never cast (305.9).
  const options = s.zones[zoneOf(p, 'hand')].filter((id) => !r.v(s.objects[id]!).types.includes('Land') && matches(s, v, s.objects[id]!, { ...e.castFromHand, zone: 'hand' }, ctx));
  if (!options.length) return;
  return r.ask({ kind: 'castFree', player: p, options });
};
