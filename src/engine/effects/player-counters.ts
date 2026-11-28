import type { Amount, PlayerRef } from '../abilities';
import type { Handler } from './kit';

/** "You get an experience counter." */
export interface PlayerCounter { playerCounter: string; n: Amount; player: PlayerRef }

export const playerCounter: Handler<PlayerCounter> = (e, r) => {
  for (const p of r.players(e.player)) {
    const k = r.n(e.n);
    const c = r.s.players[p].counters;
    c[e.playerCounter] = (c[e.playerCounter] ?? 0) + k;
    r.log(`${r.playerName(p)} gets ${k === 1 ? 'an' : k} ${e.playerCounter} counter${k === 1 ? '' : 's'} (${c[e.playerCounter]})`);
  }
};
