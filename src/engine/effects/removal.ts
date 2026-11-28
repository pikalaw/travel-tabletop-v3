import type { ObjectRef } from '../abilities';
import { move, zoneOf } from '../state';
import { leaveBattlefield, sacrifice as sacrificePermanents } from '../zones';
import type { Handler } from './kit';

export interface Destroy { destroy: ObjectRef }
export interface Exile { exile: ObjectRef }
/** Return to its owner's hand, from the battlefield or (for "return this card from your graveyard") the graveyard. */
export interface Bounce { bounce: ObjectRef }
export interface Sacrifice { sacrifice: ObjectRef }

export const destroy: Handler<Destroy> = (e, r) => {
  // 702.12b: indestructible permanents aren't destroyed.
  const ids = r.objs(e.destroy).filter((o) => !r.v(o).keywords.includes('indestructible')).map((o) => o.id);
  for (const id of ids) r.log(`${r.cardName(id)} is destroyed`);
  leaveBattlefield(r.s, ids, 'graveyard');
};

export const exile: Handler<Exile> = (e, r) => { leaveBattlefield(r.s, r.objs(e.exile).map((o) => o.id), 'exile'); };

export const bounce: Handler<Bounce> = (e, r) => {
  const targets = r.objs(e.bounce);
  leaveBattlefield(r.s, targets.filter((o) => o.zone === 'battlefield').map((o) => o.id), 'hand');
  for (const o of targets) if (o.zone.endsWith('.graveyard')) move(r.s, o.id, zoneOf(o.owner, 'hand'));
};

export const sacrifice: Handler<Sacrifice> = (e, r) => {
  // Each permanent is sacrificed by its controller ("target opponent sacrifices a creature of their choice").
  for (const o of r.objs(e.sacrifice)) { r.log(`${r.playerName(o.controller)} sacrifices ${r.cardName(o.id)}`); sacrificePermanents(r.s, [o.id], o.controller); }
};
