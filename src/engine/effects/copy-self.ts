import { createToken } from '../zones';
import type { Handler } from './kit';

/** "Create a token that's a copy of this creature" (707.2: the copiable values are its printed card's), `notLegendary`: "except it isn't legendary" (707.9b). */
export interface CopySelf { copySelf: true; notLegendary?: boolean }

export const copySelf: Handler<CopySelf> = (e, r) => {
  const src = r.s.objects[r.ctx.source];
  if (!src) return;
  const id = createToken(r.s, src.card, r.ctx.controller, { copy: true, ...(e.notLegendary ? { notLegendary: true } : {}) });
  r.s.resolving!.created = id;
  r.log(`${r.playerName(r.ctx.controller)} creates a token copy of ${r.cardName(id)}`);
};
