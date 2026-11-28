import type { Amount, PlayerRef } from '../abilities';
import { other } from '../types';
import { createToken as create } from '../zones';
import type { Handler } from './kit';

/** "Create N <token>s", by token card id (src/cards/tokens.ts). */
export interface CreateToken { createToken: string; n: Amount; controller?: PlayerRef; tapped?: boolean; attacking?: boolean }

export const createToken: Handler<CreateToken> = (e, r) => {
  const { s, ctx } = r;
  const k = r.n(e.n);
  for (const p of e.controller ? r.players(e.controller) : [ctx.controller]) {
    for (let i = 0; i < k; i++) {
      const id = create(s, e.createToken, p, { tapped: !!e.tapped || !!e.attacking });
      if (s.resolving) s.resolving.created = id;
      // 506.3d: a token put onto the battlefield attacking attacks the player it is told to, and was never declared.
      if (e.attacking && s.objects[id]) s.objects[id]!.attacking = other(p);
    }
    r.log(`${r.playerName(p)} creates ${k} ${s.setup.cards[e.createToken]!.name} token${k > 1 ? 's' : ''}`);
  }
};
