import type { Amount, PlayerRef } from '../abilities';
import type { Handler } from './kit';

export interface GainLife { gainLife: PlayerRef; n: Amount }
export interface LoseLife { loseLife: PlayerRef; n: Amount }

export const gainLife: Handler<GainLife> = (e, r) => {
  for (const p of r.players(e.gainLife)) { const k = r.n(e.n); r.s.players[p].life += k; r.log(`${r.playerName(p)} gains ${k} life`); }
};

export const loseLife: Handler<LoseLife> = (e, r) => {
  for (const p of r.players(e.loseLife)) { const k = r.n(e.n); r.s.players[p].life -= k; r.s.turnLog.lifeLost[p] += k; r.log(`${r.playerName(p)} loses ${k} life`); }
};
