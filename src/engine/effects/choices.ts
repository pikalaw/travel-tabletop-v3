import type { Condition, PlayerRef } from '../abilities';
import type { Effect } from '.';
import { holds } from '../evaluate';
import type { Handler } from './kit';

/**
 * "You may …": `text` is the card's wording for what follows, shown in the prompt. `oncePerTurn`:
 * "Do this only once each turn". `by`: another player decides ("Its controller may search …").
 * `else`: what happens if they don't ("destroy target permanent unless its controller has … deal damage to them").
 */
export interface May { may: Effect[]; text: string; oncePerTurn?: boolean; by?: PlayerRef; else?: Effect[] }
/** "You may pay {1}. If you do, …": `text` words what paying gets, as on the card. */
export interface MayPay { mayPay: string; then: Effect[]; text: string }
/** "… unless you pay / waterbend …": the controller may pay; if they don't, the effects run. `text` words them, as on the card. */
export interface UnlessPays { unlessPays: { mana?: string; waterbend?: number }; then: Effect[]; text: string }
/** "If …, … (otherwise …)." */
export interface If { if: Condition; then: Effect[]; else?: Effect[] }

export const may: Handler<May> = (e, r) => {
  const used = `may:${r.ctx.source}:${e.text}`;
  if (e.oncePerTurn && r.s.activatedThisTurn[used]) return;
  const yes = r.agreed();
  const player = e.by ? r.players(e.by)[0] : r.ctx.controller;
  if (!player) return;
  if (yes === undefined) return r.ask({ kind: 'may', player, text: e.text });
  if (!yes) { if (e.else) r.then(e.else); return; }
  if (e.oncePerTurn) r.s.activatedThisTurn[used] = 1;
  r.then(e.may);
};

export const unlessPays: Handler<UnlessPays> = (e, r) => {
  const paid = r.agreed();
  if (paid === undefined) return r.ask({ kind: 'payOrElse', player: r.ctx.controller, cost: e.unlessPays.mana ?? '', ...(e.unlessPays.waterbend ? { waterbend: e.unlessPays.waterbend } : {}), otherwise: e.text });
  if (!paid) r.then(e.then);
};

export const mayPay: Handler<MayPay> = (e, r) => {
  const paid = r.agreed();
  if (paid === undefined) return r.ask({ kind: 'payOrElse', player: r.ctx.controller, cost: e.mayPay, reward: e.text });
  if (paid) r.then(e.then);
};

export const conditional: Handler<If> = (e, r) => r.then(holds(r.s, r.v, e.if, r.ctx) ? e.then : e.else ?? []);
