/**
 * Casting and activating as the UI asks them (PRD, "Casting a card"): a drag or a Cast button
 * starts an intent; the app then asks only what the card still needs, in the order of CR 601.2
 * (modes, X, targets, a creature to tap), and last the confirm step with the cost and the sources
 * auto-payment will tap. The engine has the last word: a refused answer goes back to the player.
 */
import type { TargetSpec } from '../engine/abilities';
import { castCost, costChoices, spellAbility, tapCandidates, whyNotCast } from '../engine/engine';
import { legalTargets } from '../engine/targets';
import type { Choice, GameState, ObjectId, PlayerId, Target } from '../engine/types';

/** A cast (with its modes and X) or an activation (with the creature it taps), and the targets chosen so far. */
export interface Intent {
  kind: 'cast' | 'activate';
  object: ObjectId;
  /** For an activation: which ability. */
  ability?: number;
  modes?: number[];
  /** Which additional-cost option ("pay {4} or sacrifice …"), and what a cost sacrifices or discards. */
  cost?: number;
  sacrificing?: ObjectId[];
  discarding?: ObjectId[];
  x?: number;
  targets: Target[][];
  tapping?: ObjectId[];
}

export type Need =
  | { kind: 'modes'; options: { text: string; ok: boolean }[]; min: number; max: number }
  | { kind: 'cost'; options: { text: string; ok: boolean }[] }
  | { kind: 'sacrifice' | 'discard'; options: ObjectId[]; count: number }
  | { kind: 'x' }
  | { kind: 'target'; spec: number; legal: Target[]; count: number; upTo: boolean; text: string }
  | { kind: 'tap'; options: ObjectId[] }
  | { kind: 'confirm' };

const scriptOf = (s: GameState, id: ObjectId) => s.setup.cards[s.objects[id]!.card]?.script;

export function specsOf(s: GameState, i: Intent): TargetSpec[] {
  if (i.kind === 'cast') return spellAbility(s, i.object, i.modes).specs;
  return scriptOf(s, i.object)?.activated?.[i.ability ?? 0]?.targets ?? [];
}

export function describeSpec(spec: TargetSpec): string {
  if ('any' in spec) return 'any target';
  if ('players' in spec) return spec.players === 'opponent' ? 'target opponent' : 'target player';
  const f = spec.objects;
  const n = spec.count ?? 1;
  const what = [f.tapped ? 'tapped' : '', f.attacking ? 'attacking' : '', f.notTypes?.includes('Land') ? 'nonland' : '', (f.types ?? f.subtypes ?? ['permanent']).join(' or ').toLowerCase()].filter(Boolean).join(' ');
  const whose = f.controller === 'you' ? ' you control' : f.controller === 'opponent' ? ' an opponent controls' : '';
  return `${spec.upTo ? `up to ${n} ` : n > 1 ? `${n} ` : ''}target ${what}${whose}`;
}

/** The next question the intent needs answered, or the confirm step. */
export function nextNeed(s: GameState, p: PlayerId, i: Intent): Need {
  const ctx = { controller: p, source: i.object };
  if (i.kind === 'cast') {
    const spell = scriptOf(s, i.object)?.spell;
    if (spell?.modes && !i.modes) {
      return {
        kind: 'modes', min: spell.modes.min, max: spell.modes.max,
        options: spell.modes.options.map((m) => ({ text: m.text, ok: (m.targets ?? []).every((t) => legalTargets(s, t, ctx).length > 0) })),
      };
    }
    // 601.2b: additional costs are announced with the modes, before targets.
    if (spell?.costOptions && i.cost === undefined) {
      return { kind: 'cost', options: spell.costOptions.map((o, k) => ({ text: o.text, ok: !whyNotCast(s, p, i.object, undefined, undefined, i.x ?? 0, k) })) };
    }
    if (i.x === undefined && s.setup.cards[s.objects[i.object]!.card]!.manaCost.some((m) => m.kind === 'x')) return { kind: 'x' };
  }
  const specs = specsOf(s, i);
  if (i.targets.length < specs.length) {
    const k = i.targets.length;
    const spec = specs[k]!;
    const count = 'objects' in spec ? spec.count ?? 1 : 1;
    return { kind: 'target', spec: k, legal: legalTargets(s, spec, ctx), count, upTo: 'objects' in spec && !!spec.upTo, text: describeSpec(spec) };
  }
  // Costs that take objects: asked only when there is a real choice.
  const cost = i.kind === 'cast' ? castCost(s, i.object, i.cost) : scriptOf(s, i.object)?.activated?.[i.ability ?? 0]?.cost;
  const choices = costChoices(s, p, cost, i.object);
  for (const kind of ['sacrifice', 'discard'] as const) {
    const c = choices[kind];
    const chosen = kind === 'sacrifice' ? i.sacrificing : i.discarding;
    if (c && c.count > 0 && !chosen && c.options.length > c.count) return { kind, options: c.options, count: c.count };
  }
  if (i.kind === 'activate' && !i.tapping) {
    const a = scriptOf(s, i.object)?.activated?.[i.ability ?? 0];
    if (a?.cost.tapAnother) return { kind: 'tap', options: tapCandidates(s, p, a) };
  }
  return { kind: 'confirm' };
}

export function toChoice(i: Intent): Choice {
  if (i.kind === 'cast') return { kind: 'cast', object: i.object, targets: i.targets, ...(i.modes ? { modes: i.modes } : {}), ...(i.x !== undefined ? { x: i.x } : {}), ...(i.cost !== undefined ? { cost: i.cost } : {}), ...(i.sacrificing ? { sacrificing: i.sacrificing } : {}), ...(i.discarding ? { discarding: i.discarding } : {}) };
  return { kind: 'activate', object: i.object, ability: i.ability ?? 0, targets: i.targets, ...(i.tapping ? { tapping: i.tapping } : {}), ...(i.sacrificing ? { sacrificing: i.sacrificing } : {}), ...(i.discarding ? { discarding: i.discarding } : {}) };
}

/** A drop on a legal target for the first target spec chooses it (PRD, "Dropping on a target targets it"). */
export function withDrop(s: GameState, p: PlayerId, i: Intent, drop: Target | null): Intent {
  if (!drop) return i;
  const need = nextNeed(s, p, i);
  if (need.kind !== 'target' || need.spec !== 0 || need.count !== 1 || !need.legal.includes(drop)) return i;
  return { ...i, targets: [[drop]] };
}
