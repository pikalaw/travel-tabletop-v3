import type { ObjectRef } from '../abilities';
import { move, zoneOf } from '../state';
import { leaveBattlefield, sacrifice as sacrificePermanents } from '../zones';
import type { Handler } from './kit';

export interface Destroy { destroy: ObjectRef }
/** Exile, from the battlefield or another zone; `linked`: remembered as exiled with the source ("exiled with Nyla"). */
export interface Exile { exile: ObjectRef; linked?: boolean }
/** Return to its owner's hand, from the battlefield or (for "return this card from your graveyard") the graveyard. */
export interface Bounce { bounce: ObjectRef }
export interface Sacrifice { sacrifice: ObjectRef }

export const destroy: Handler<Destroy> = (e, r) => {
  // 702.12b: indestructible permanents aren't destroyed.
  const ids = r.objs(e.destroy).filter((o) => !r.v(o).keywords.includes('indestructible')).map((o) => o.id);
  for (const id of ids) r.log(`${r.cardName(id)} is destroyed`);
  leaveBattlefield(r.s, ids, 'graveyard');
};

export const exile: Handler<Exile> = (e, r) => {
  const all = r.objs(e.exile);
  const ids = [
    ...leaveBattlefield(r.s, all.filter((o) => o.zone === 'battlefield').map((o) => o.id), 'exile'),
    ...all.filter((o) => o.zone.endsWith('.graveyard') || o.zone.endsWith('.hand')).map((o) => { r.log(`${r.cardName(o.id)} is exiled`); return move(r.s, o.id, zoneOf(o.owner, 'exile')).id; }),
  ];
  if (e.linked) for (const id of ids) if (r.s.objects[id]) r.s.objects[id]!.exiledWith = r.ctx.source;
};

export const bounce: Handler<Bounce> = (e, r) => {
  const targets = r.objs(e.bounce);
  leaveBattlefield(r.s, targets.filter((o) => o.zone === 'battlefield').map((o) => o.id), 'hand');
  for (const o of targets) if (o.zone.endsWith('.graveyard') || o.zone.endsWith('.exile')) { r.log(`${r.cardName(o.id)} returns to ${r.playerName(o.owner)}'s hand`); move(r.s, o.id, zoneOf(o.owner, 'hand')); }
};

export const sacrifice: Handler<Sacrifice> = (e, r) => {
  // Each permanent is sacrificed by its controller ("target opponent sacrifices a creature of their choice").
  for (const o of r.objs(e.sacrifice)) { r.log(`${r.playerName(o.controller)} sacrifices ${r.cardName(o.id)}`); sacrificePermanents(r.s, [o.id], o.controller); }
};
