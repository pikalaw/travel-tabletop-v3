import type { Filter } from '../abilities';
import { matches } from '../evaluate';
import { fire } from '../triggers';
import { move, top, zoneOf } from '../state';
import { putOntoBattlefield } from '../zones';
import type { Handler } from './kit';

/**
 * Look at (or reveal) the top card of your library and choose what happens to it, among the
 * options whose filter it matches; `stay` says where it goes when none is taken (Bison Whistle,
 * Descendants' Path).
 */
export interface TopCard {
  topCard: { is: Filter; to: 'battlefield' | 'hand' | 'graveyard' | 'castFree'; text: string }[];
  reveal?: boolean;
  stay: 'top' | 'bottom';
}

export const topCard: Handler<TopCard> = (e, r) => {
  const { s, v, ctx } = r;
  const p = ctx.controller;
  const id = top(s, p);
  if (!id) return;
  if (e.reveal) r.log(`${r.playerName(p)} reveals ${r.cardName(id)}`);
  const options = e.topCard.filter((o) => matches(s, v, s.objects[id]!, { ...o.is, zone: 'library' }, ctx));
  const stay = e.stay === 'top' ? 'Leave it on top' : 'Put it on the bottom';
  const picked = r.answer('option');
  if (!picked) {
    if (!options.length && e.stay === 'top') return;
    if (options.length) return r.ask({ kind: 'choose', player: p, text: `${e.reveal ? 'Revealed' : 'The top card of your library'}: ${r.cardName(id)}`, options: [...options.map((o) => o.text), stay], cards: [id] });
  }
  const o = picked ? options[picked.index] : undefined;
  if (!o) {
    if (e.stay === 'bottom') { r.log(`${r.playerName(p)} puts ${e.reveal ? r.cardName(id) : 'it'} on the bottom of their library`); move(s, id, zoneOf(p, 'library'), { bottom: true }); }
    return;
  }
  r.log(`${r.playerName(p)} ${o.text.charAt(0).toLowerCase()}${o.text.slice(1)}: ${r.cardName(id)}`);
  if (o.to === 'battlefield') putOntoBattlefield(s, id, p);
  else if (o.to === 'hand') move(s, id, zoneOf(p, 'hand'));
  else if (o.to === 'graveyard') move(s, id, zoneOf(p, 'graveyard'));
  else {
    // Cast during resolution without paying its mana cost (608.2g): onto the stack, above this ability.
    const spell = move(s, id, 'stack', { controller: p });
    spell.targets = [];
    fire(s, { kind: 'cast', object: spell.id, player: p });
  }
};
