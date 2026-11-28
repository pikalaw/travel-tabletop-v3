import type { Filter, ObjectRef } from '../abilities';
import { matches } from '../evaluate';
import { nextInt } from '../rng';
import { move, zoneOf } from '../state';
import type { Handler } from './kit';

/**
 * "Exile an instant or sorcery card with mana value 3 or less from your graveyard at random. You
 * may cast it without paying its mana cost. If that spell would be put into a graveyard, exile it
 * instead" (Storm of Memories). The cast is the answer to a castFree decision (engine.ts).
 */
export interface CastRandomFromGraveyard { castRandomFromGraveyard: Filter }

export const castRandomFromGraveyard: Handler<CastRandomFromGraveyard> = (e, r) => {
  const { s, v, ctx } = r;
  if (s.resolving!.castFreeAnswered) return;
  const p = ctx.controller;
  const cards = s.zones[zoneOf(p, 'graveyard')].filter((id) => matches(s, v, s.objects[id]!, { ...e.castRandomFromGraveyard, zone: 'graveyard' }, ctx));
  if (!cards.length) return;
  const [i, rng] = nextInt(s.rng, cards.length);
  s.rng = rng;
  r.log(`${r.playerName(p)} exiles ${r.cardName(cards[i]!)} from their graveyard at random`);
  const exiled = move(s, cards[i]!, zoneOf(p, 'exile'));
  return r.ask({ kind: 'castFree', player: p, options: [exiled.id], exileAfter: true });
};

/** "Target instant or sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost." */
export interface GrantFlashback { grantFlashback: ObjectRef }

export const grantFlashback: Handler<GrantFlashback> = (e, r) => {
  for (const o of r.objs(e.grantFlashback)) {
    o.flashbackThisTurn = r.s.turn;
    r.log(`${r.cardName(o.id)} gains flashback until end of turn`);
  }
};
