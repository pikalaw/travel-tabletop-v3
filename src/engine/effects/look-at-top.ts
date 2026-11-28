import type { Amount, Filter } from '../abilities';
import type { Effect } from '.';
import { matches } from '../evaluate';
import { shuffle } from '../rng';
import { move, zoneOf } from '../state';
import type { Handler } from './kit';

/**
 * Look at the top N of your library and you may put a matching card into your hand; the rest go
 * to the bottom in a random order, or (mill) all go to the graveyard first. `otherwise` runs if
 * none was taken ("If you don't, put a +1/+1 counter on this creature").
 */
export interface LookAtTop { lookAtTop: Amount; mayTake: Filter; rest: 'bottomRandom' | 'mill'; otherwise?: Effect[] }

export const lookAtTop: Handler<LookAtTop> = (e, r) => {
  const { s, v, ctx } = r;
  const p = ctx.controller;
  const res = s.resolving!;
  const picked = r.answer('pick');
  if (!picked) {
    const lib = s.zones[zoneOf(p, 'library')];
    const k = Math.min(r.n(e.lookAtTop), lib.length);
    let seen = lib.slice(lib.length - k).reverse(); // top first
    if (e.rest === 'mill') { seen = seen.map((id) => move(s, id, zoneOf(p, 'graveyard')).id); r.log(`${r.playerName(p)} mills ${k}`); }
    res.looked = seen;
    const options = seen.filter((id) => matches(s, v, s.objects[id]!, { ...e.mayTake, zone: e.rest === 'mill' ? 'graveyard' : 'library' }, ctx));
    return r.ask({ kind: 'pick', player: p, from: seen, options, min: 0, max: 1, text: e.rest === 'mill' ? 'You may put one into your hand' : 'You may reveal one and put it into your hand' });
  }
  const seen = res.looked ?? [];
  delete res.looked;
  for (const id of picked.cards) { r.log(`${r.playerName(p)} ${e.rest === 'mill' ? 'takes' : 'reveals'} ${r.cardName(id)} and puts it into their hand`); move(s, id, zoneOf(p, 'hand')); }
  if (e.rest === 'bottomRandom') {
    const [rest, rng] = shuffle(s.rng, seen.filter((id) => !picked.cards.includes(id)));
    s.rng = rng;
    const keep = s.zones[zoneOf(p, 'library')].filter((id) => !rest.includes(id));
    s.zones[zoneOf(p, 'library')] = [...rest, ...keep]; // the bottom is the first element
  }
  if (!picked.cards.length && e.otherwise) r.then(e.otherwise);
};
