import type { ObjectRef } from '../abilities';
import { move, zoneOf } from '../state';
import type { Handler } from './kit';

/** "Put two cards from your hand on top of your library in any order": the first chosen ends on top. */
export interface ToLibraryTop { toLibraryTop: ObjectRef }

export const toLibraryTop: Handler<ToLibraryTop> = (e, r) => {
  const cards = r.objs(e.toLibraryTop);
  for (const o of [...cards].reverse()) move(r.s, o.id, zoneOf(o.owner, 'library'));
  if (cards.length) r.log(`${r.playerName(r.ctx.controller)} puts ${cards.length} card${cards.length > 1 ? 's' : ''} on top of their library`);
};
