import type { Amount, ObjectRef, PlayerRef } from '../abilities';
import { move, shuffleLibrary, top, zoneOf } from '../state';
import { leaveBattlefield } from '../zones';
import type { Handler } from './kit';

/** Mill N (701.17): the top N cards of the library go into the graveyard. */
export interface Mill { mill: PlayerRef; n: Amount }
/** "Exile the top card of your library. You may play that card this turn." */
export interface ExileTopPlayable { exileTopPlayable: true }
/** "Its owner shuffles it into their library." */
export interface ShuffleIntoLibrary { shuffleIntoLibrary: ObjectRef }

export const mill: Handler<Mill> = (e, r) => {
  const milled: string[] = [];
  for (const p of r.players(e.mill)) {
    const k = r.n(e.n);
    for (let i = k; i > 0; i--) { const id = top(r.s, p); if (id) milled.push(move(r.s, id, zoneOf(p, 'graveyard')).id); }
    if (k > 0) r.log(`${r.playerName(p)} mills ${k}`);
  }
  r.s.resolving!.chosen = milled; // "a card milled this way"
};

export const exileTopPlayable: Handler<ExileTopPlayable> = (_e, r) => {
  const p = r.ctx.controller;
  const id = top(r.s, p);
  if (!id) return;
  const o = move(r.s, id, zoneOf(p, 'exile'));
  o.playableTurn = r.s.turn;
  r.log(`${r.playerName(p)} exiles ${r.cardName(o.id)} from the top of their library; they may play it this turn`);
};

export const shuffleIntoLibrary: Handler<ShuffleIntoLibrary> = (e, r) => {
  for (const o of r.objs(e.shuffleIntoLibrary)) {
    const owner = o.owner;
    leaveBattlefield(r.s, [o.id], 'library');
    shuffleLibrary(r.s, owner);
  }
};
