import type { Filter, PlayerRef } from '../abilities';
import { matches } from '../evaluate';
import { zoneOf } from '../state';
import { discardCard } from '../zones';
import type { Handler } from './kit';

/** "Target opponent reveals their hand. You choose a … card from it. That player discards that card." */
export interface RevealAndDiscard { revealAndDiscard: PlayerRef; discards: Filter }

export const revealAndDiscard: Handler<RevealAndDiscard> = (e, r) => {
  const { s, v, ctx } = r;
  const picked = r.answer('pick');
  for (const q of r.players(e.revealAndDiscard)) {
    const shown = [...s.zones[zoneOf(q, 'hand')]];
    if (!picked) {
      r.log(`${r.playerName(q)} reveals their hand`);
      const options = shown.filter((id) => matches(s, v, s.objects[id]!, { ...e.discards, zone: 'hand' }, ctx));
      if (!options.length) continue;
      return r.ask({ kind: 'pick', player: ctx.controller, from: shown, options, min: 1, max: 1, text: `Choose a card for ${r.playerName(q)} to discard` });
    }
    for (const id of picked.cards) discardCard(s, q, id);
  }
};
