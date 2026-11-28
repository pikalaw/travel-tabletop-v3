/**
 * What a spell or ability on the stack does and targets: its target specs, effects and context,
 * from its card's script (a spell's chosen modes, an ability's definition).
 */
import type { Condition, TargetSpec } from './abilities';
import type { Effect } from './effects';
import type { Context } from './evaluate';
import { obj, spellOf } from './state';
import { triggeredAbility } from './triggers';
import type { GameState, ObjectId } from './types';

/** Shifts every {target: n} in effects by `by`, so a mode's local target indices fit the whole spell. */
function shiftTargets<T>(v: T, by: number): T {
  if (Array.isArray(v)) return v.map((x) => shiftTargets(x, by)) as T;
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = (k === 'target' || k === 'controlledByTarget') && typeof x === 'number' ? x + by : shiftTargets(x, by);
    return out as T;
  }
  return v;
}

/** A spell's target specs and effects; for a modal spell, those of the chosen modes, in order. */
export function spellAbility(s: GameState, id: ObjectId, modes?: number[]): { specs: TargetSpec[]; effects: Effect[] } {
  const spell = spellOf(s, id);
  if (spell?.enchant) return { specs: [{ objects: spell.enchant }], effects: [] };
  if (!spell?.modes) return { specs: spell?.targets ?? [], effects: spell?.effects ?? [] };
  const specs: TargetSpec[] = [];
  const effects: Effect[] = [];
  for (const m of modes ?? []) {
    const mode = spell.modes.options[m]!;
    effects.push(...shiftTargets(mode.effects, specs.length));
    specs.push(...(mode.targets ?? []));
  }
  return { specs, effects };
}

/** A stack object's target specs, effects and context; for a triggered ability, its intervening "if" too. */
export function onStack(s: GameState, id: ObjectId): { specs: TargetSpec[]; effects: Effect[]; ctx: Context; condition?: Condition } {
  const o = obj(s, id);
  const a = o.ability;
  const ctx: Context = { controller: o.controller, source: a ? a.source : id, ...(a?.eventObject ? { eventObject: a.eventObject } : {}), ...(a?.eventAmount !== undefined ? { eventAmount: a.eventAmount } : {}), ...(a?.eventSource ? { eventSource: a.eventSource } : {}), ...(o.x !== undefined ? { x: o.x } : {}) };
  if (!a) return { ...spellAbility(s, id, o.modes), ctx };
  const def = a.kind === 'activated' ? s.setup.cards[o.card]!.script!.activated![a.index]! : triggeredAbility(s, o.card, a.index);
  const condition = a.kind === 'triggered' && 'if' in def ? def.if : undefined;
  return { specs: def.targets ?? [], effects: def.effects, ctx, ...(condition ? { condition } : {}) };
}
