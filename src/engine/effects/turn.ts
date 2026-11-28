import type { Handler } from './kit';

/** "You may play an additional land this turn." */
export interface ExtraLand { extraLand: number }

export const extraLand: Handler<ExtraLand> = (e, r) => { r.s.players[r.ctx.controller].extraLands += e.extraLand; };
