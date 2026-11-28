import type { Amount, PlayerRef } from '../abilities';
import { other } from '../types';
import { createToken as create } from '../zones';
import type { Handler } from './kit';

/** "Create N <token>s", by token card id (src/cards/tokens.ts). */
/** `sacrificeAtEndStep`: "Sacrifice that token at the beginning of the next end step." */
export interface CreateToken { createToken: string; n: Amount; controller?: PlayerRef; tapped?: boolean; attacking?: boolean; sacrificeAtEndStep?: boolean }

export const createToken: Handler<CreateToken> = (e, r) => {
  const { s, ctx } = r;
  const k = r.n(e.n);
  const made: string[] = [];
  for (const p of e.controller ? r.players(e.controller) : [ctx.controller]) {
    for (let i = 0; i < k; i++) {
      const id = create(s, e.createToken, p, { tapped: !!e.tapped || !!e.attacking });
      made.push(id);
      if (s.resolving) s.resolving.created = id;
      // 506.3d: a token put onto the battlefield attacking attacks the player it is told to, and was never declared.
      if (e.attacking && s.objects[id]) s.objects[id]!.attacking = other(p);
    }
    r.log(`${r.playerName(p)} creates ${k} ${s.setup.cards[e.createToken]!.name} token${k > 1 ? 's' : ''}`);
  }
  if (e.sacrificeAtEndStep && made.length) {
    const src = s.objects[ctx.source];
    s.delayed.push({
      ability: { when: { step: 'end', whose: 'any' }, effects: [{ sacrifice: { ids: made } }], text: 'At the beginning of the next end step, sacrifice that token.' },
      controller: ctx.controller, source: ctx.source, sourceName: src ? r.v(src).name : 'An ability', card: src?.card ?? e.createToken,
    });
  }
};
