import type { Amount } from '../abilities';
import type { Color } from '../types';
import type { Handler } from './kit';

/**
 * "Add {R}{R}". `anyColor` and `orChosenColor` are mana abilities' colour choices, made by the
 * payment solver when it pays a cost (engine.ts), so they never resolve here.
 */
export interface AddMana { addMana: (Color | 'C')[]; n?: Amount; anyColor?: boolean; untilEndOfCombat?: boolean; orChosenColor?: boolean }

export const addMana: Handler<AddMana> = (e, r) => {
  if (e.anyColor) throw new Error('mana of any colour is chosen by the payment solver, not resolved');
  const k = e.n === undefined ? 1 : r.n(e.n);
  const p = r.s.players[r.ctx.controller];
  const pool = e.untilEndOfCombat ? p.combatPool : p.pool;
  for (const c of e.addMana) pool[c] += k;
};
