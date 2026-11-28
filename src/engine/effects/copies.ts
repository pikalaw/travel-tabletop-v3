import type { ObjectRef } from '../abilities';
import { createObject } from '../state';
import type { GameObject } from '../types';
import type { Handler } from './kit';

/**
 * "Copy that ability" (Firebender Ascension): the attacking creature's triggered ability that
 * triggered this one triggers again, and its controller chooses targets for the copy (707.10c).
 */
export interface CopyTrigger { copyTrigger: true }

export const copyTrigger: Handler<CopyTrigger> = (_e, r) => {
  const creature = r.ctx.eventObject ? r.s.objects[r.ctx.eventObject] : undefined;
  if (!creature || r.ctx.eventAmount === undefined) return;
  r.log(`${r.playerName(r.ctx.controller)} copies ${r.cardName(creature.id)}'s ability`);
  r.s.pendingTriggers.push({ controller: r.ctx.controller, source: creature.id, sourceName: r.cardName(creature.id), card: creature.card, index: r.ctx.eventAmount, eventObject: creature.id });
};

/** "Copy it" (Jeong Jeong): a copy of a spell on the stack, with the same modes, X and targets (707.10). */
export interface CopySpell { copySpell: ObjectRef }

export const copySpell: Handler<CopySpell> = (e, r) => {
  for (const o of r.objs(e.copySpell)) {
    if (o.zone !== 'stack' || o.ability) continue;
    const c: GameObject = createObject(r.s, o.card, r.ctx.controller, 'stack');
    c.controller = r.ctx.controller;
    c.spellCopy = true;
    c.targets = (o.targets ?? []).map((ts) => [...ts]);
    if (o.modes) c.modes = [...o.modes];
    if (o.x !== undefined) c.x = o.x;
    r.log(`${r.playerName(r.ctx.controller)} copies ${r.cardName(o.id)}`);
  }
};
