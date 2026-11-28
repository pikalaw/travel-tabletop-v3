import type { ObjectRef } from '../abilities';
import { move, zoneOf } from '../state';
import type { GameObject, GameState } from '../types';
import { isPlayer, type Handler } from './kit';

/** "Counter target spell or ability." */
export interface CounterSpell { counterSpell: ObjectRef }
/** "Counter target spell unless its controller pays {2}." */
export interface CounterUnlessPays { counterUnlessPays: string; on: ObjectRef }

function counter(s: GameState, o: GameObject): void {
  if (o.ability || o.spellCopy) { s.zones.stack.splice(s.zones.stack.indexOf(o.id), 1); delete s.objects[o.id]; } else move(s, o.id, zoneOf(o.owner, 'graveyard'));
}

export const counterSpell: Handler<CounterSpell> = (e, r) => {
  for (const t of r.recipients(e.counterSpell)) {
    const o = !isPlayer(t) ? r.s.objects[t] : undefined;
    if (!o || o.zone !== 'stack') continue;
    r.log(`${r.cardName(o.id)} is countered`);
    counter(r.s, o);
  }
};

export const counterUnlessPays: Handler<CounterUnlessPays> = (e, r) => {
  const paid = r.agreed();
  for (const t of r.recipients(e.on)) {
    const o = !isPlayer(t) ? r.s.objects[t] : undefined;
    if (!o || o.zone !== 'stack') continue;
    if (paid === undefined) return r.ask({ kind: 'payOrElse', player: o.controller, cost: e.counterUnlessPays, otherwise: `${r.cardName(o.id)} is countered` });
    if (paid) { r.log(`${r.playerName(o.controller)} pays ${e.counterUnlessPays}`); continue; }
    r.log(`${r.cardName(o.id)} is countered`);
    counter(r.s, o);
  }
};
