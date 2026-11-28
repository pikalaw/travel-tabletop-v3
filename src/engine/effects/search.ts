import type { Amount, Filter } from '../abilities';
import { matches } from '../evaluate';
import { move, shuffleLibrary, zoneOf } from '../state';
import { putOntoBattlefield } from '../zones';
import type { Handler } from './kit';

/** Search your library for up to `n` cards matching the filter, put them somewhere, then shuffle (701.23). */
export interface Search { search: Filter; n?: Amount; to: 'hand' | 'battlefield'; tapped?: boolean }

export const search: Handler<Search> = (e, r) => {
  const { s, v, ctx } = r;
  const p = ctx.controller;
  const picked = r.answer('pick');
  if (!picked) {
    const options = s.zones[zoneOf(p, 'library')].filter((id) => matches(s, v, s.objects[id]!, { ...e.search, zone: 'library' }, ctx));
    const max = e.n === undefined ? 1 : r.n(e.n);
    return r.ask({ kind: 'pick', player: p, from: options, options, min: 0, max, text: options.length ? `Search your library: take up to ${max === 1 ? 'one' : max}` : 'Search your library: nothing matches', done: 'Take', none: 'Find nothing' });
  }
  for (const id of picked.cards) {
    r.log(`${r.playerName(p)} finds ${r.cardName(id)}`);
    if (e.to === 'hand') move(s, id, zoneOf(p, 'hand')); else putOntoBattlefield(s, id, p, { tapped: !!e.tapped });
  }
  shuffleLibrary(s, p);
};
