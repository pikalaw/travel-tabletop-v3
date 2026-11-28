import type { Amount, PlayerRef } from '../abilities';
import { move, zoneOf } from '../state';
import type { Handler, Resolution } from './kit';

/** Scry N (701.22): look at the top N, then put any on the bottom and the rest back in any order. */
export interface Scry { scry: Amount; player?: PlayerRef }
/** Surveil N (701.25): the same, but the ones moved away go into the graveyard. */
export interface Surveil { surveil: Amount }

function arrange(r: Resolution, n: Amount, to: 'bottom' | 'graveyard', who?: PlayerRef) {
  // The player looks at the top cards (privately) and decides where each goes.
  const { s } = r;
  const p = who ? r.players(who)[0] : r.ctx.controller;
  if (!p) return;
  const lib = s.zones[zoneOf(p, 'library')];
  const k = Math.min(r.n(n), lib.length);
  if (k === 0) return;
  const answer = r.answer('arrange');
  if (!answer) return r.ask({ kind: 'arrange', player: p, cards: lib.slice(lib.length - k).reverse(), to }); // top first
  const rest = lib.slice(0, lib.length - k);
  const top = [...answer.top].reverse();
  if (to === 'bottom') s.zones[zoneOf(p, 'library')] = [...[...answer.away].reverse(), ...rest, ...top];
  else {
    for (const id of answer.away) move(s, id, zoneOf(p, 'graveyard')); // from the library as it is
    s.zones[zoneOf(p, 'library')] = [...rest, ...top];
  }
  r.log(`${r.playerName(p)} ${to === 'bottom' ? 'scries' : 'surveils'} ${k}: ${answer.top.length} on top, ${answer.away.length} ${to === 'bottom' ? 'on the bottom' : 'into the graveyard'}`);
}

export const scry: Handler<Scry> = (e, r) => arrange(r, e.scry, 'bottom', e.player);
export const surveil: Handler<Surveil> = (e, r) => arrange(r, e.surveil, 'graveyard');
