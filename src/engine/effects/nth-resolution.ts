import type { Effect } from '.';
import type { Handler } from './kit';

/** "If this is the second time this ability has resolved this turn, draw a card": counted per source each turn. */
export interface NthResolution { nthResolution: number; then: Effect[] }

export const nthResolution: Handler<NthResolution> = (e, r) => {
  const key = `resolved:${r.ctx.source}`;
  const n = (r.s.activatedThisTurn[key] ?? 0) + 1;
  r.s.activatedThisTurn[key] = n;
  if (n === e.nthResolution) r.then(e.then);
};
