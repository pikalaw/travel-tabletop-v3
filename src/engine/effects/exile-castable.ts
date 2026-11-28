import type { ObjectRef } from '../abilities';
import { move, zoneOf } from '../state';
import type { GameObject } from '../types';
import { leaveBattlefield } from '../zones';
import type { Handler } from './kit';

/**
 * Exile cards another player may then cast (or play) from exile (Hama, Fire Lord Ozai): free, or
 * by waterbending {X} where X is its mana value; while the ability's controller controls its
 * source (`whileSource`), and only during their turn (`yourTurnOnly`), or until end of turn
 * (`thisTurn`). With `oneOf`, playing one of them ends the others' permission.
 */
export interface ExileCastable {
  exileCastable: ObjectRef; cost: 'free' | 'waterbendManaValue';
  whileSource?: boolean; yourTurnOnly?: boolean; thisTurn?: boolean; oneOf?: boolean;
}

export const exileCastable: Handler<ExileCastable> = (e, r) => {
  const { s, ctx } = r;
  const cards = r.objs(e.exileCastable).filter((o) => o.zone !== 'stack' && !o.zone.endsWith('.exile'));
  const group = e.oneOf ? `${ctx.source}:${s.seq}` : undefined;
  for (const o of cards) {
    const name = r.cardName(o.id);
    const exiled: GameObject | undefined = o.zone === 'battlefield'
      ? s.objects[leaveBattlefield(s, [o.id], 'exile')[0] ?? '']
      : move(s, o.id, zoneOf(o.owner, 'exile'));
    if (!exiled) continue;
    exiled.castableBy = {
      player: ctx.controller, cost: e.cost,
      ...(e.whileSource ? { source: ctx.source } : {}), ...(e.thisTurn ? { untilTurn: s.turn } : {}),
      ...(e.yourTurnOnly ? { yourTurnOnly: true } : {}), ...(group ? { group } : {}),
    };
    r.log(`${r.playerName(o.owner)}'s ${name} is exiled; ${r.playerName(ctx.controller)} may ${e.cost === 'free' ? 'play it without paying its mana cost' : 'cast it by waterbending its mana value'}`);
  }
};
