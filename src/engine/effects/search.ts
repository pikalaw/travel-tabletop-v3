import type { Amount, Filter, PlayerRef } from '../abilities';
import { matches } from '../evaluate';
import { move, shuffleLibrary, zoneOf } from '../state';
import { putOntoBattlefield } from '../zones';
import type { Handler } from './kit';

/**
 * Search your library (and, with `graveyardToo`, your graveyard) for up to `n` cards matching the
 * filter, put them somewhere, then shuffle (701.23). `player`: another player searches their own.
 */
export interface Search { search: Filter; n?: Amount; to: 'hand' | 'battlefield'; tapped?: boolean; graveyardToo?: boolean; player?: PlayerRef }

export const search: Handler<Search> = (e, r) => {
  const { s, v, ctx } = r;
  const p = e.player ? r.players(e.player)[0] : ctx.controller;
  if (!p) return;
  const picked = r.answer('pick');
  if (!picked) {
    const options = [
      ...s.zones[zoneOf(p, 'library')].filter((id) => matches(s, v, s.objects[id]!, { ...e.search, zone: 'library' }, ctx)),
      ...(e.graveyardToo ? s.zones[zoneOf(p, 'graveyard')].filter((id) => matches(s, v, s.objects[id]!, { ...e.search, zone: 'graveyard' }, ctx)) : []),
    ];
    const max = e.n === undefined ? 1 : r.n(e.n);
    return r.ask({ kind: 'pick', player: p, from: options, options, min: 0, max, text: options.length ? `Search your library: take up to ${max === 1 ? 'one' : max}` : 'Search your library: nothing matches', done: 'Take', none: 'Find nothing' });
  }
  for (const id of picked.cards) {
    r.log(`${r.playerName(p)} finds ${r.cardName(id)}`);
    if (e.to === 'hand') move(s, id, zoneOf(p, 'hand')); else putOntoBattlefield(s, id, p, { tapped: !!e.tapped });
  }
  shuffleLibrary(s, p);
};
