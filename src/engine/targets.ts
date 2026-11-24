/**
 * Targets (CR 115): which objects and players a target spec allows, checking a chosen set when a
 * spell or ability is put on the stack, and again as it resolves (608.2b).
 */
import type { TargetSpec } from './abilities';
import { view } from './characteristics';
import { matches, select, type Context } from './evaluate';
import type { GameState, Target } from './types';
import { PLAYERS } from './types';

/** Everything `spec` could target now. Hexproof and ward come with M4's keywords. */
export function legalTargets(s: GameState, spec: TargetSpec, ctx: Context): Target[] {
  const v = view(s);
  if ('players' in spec) return PLAYERS.filter((p) => spec.players === 'any' || p !== ctx.controller);
  if ('any' in spec) {
    return [...select(s, v, { types: ['Creature'] }, ctx).filter(targetable(s, ctx)).map((o) => o.id), ...PLAYERS];
  }
  return select(s, v, spec.objects, ctx).filter(targetable(s, ctx)).map((o) => o.id);
}

/** Hexproof (702.11): can't be the target of spells or abilities an opponent controls. */
const targetable = (s: GameState, ctx: Context) => (o: { id: string; controller: string }) => {
  if (o.id === ctx.source) return true;
  const kws = view(s)(s.objects[o.id]!).keywords;
  return !(kws.includes('hexproof') && o.controller !== ctx.controller);
};

export function isLegalTarget(s: GameState, spec: TargetSpec, ctx: Context, t: Target): boolean {
  if (t === 'p1' || t === 'p2') return 'players' in spec ? spec.players === 'any' || t !== ctx.controller : 'any' in spec;
  const o = s.objects[t];
  if (!o) return false;
  if ('players' in spec) return false;
  const f = 'any' in spec ? { types: ['Creature'] } : spec.objects;
  return matches(s, view(s), o, f, ctx) && targetable(s, ctx)(o);
}

const countOf = (spec: TargetSpec) => ('objects' in spec ? spec.count ?? 1 : 1);

/** Why a chosen set of targets is illegal, or null (601.2c). */
export function checkTargets(s: GameState, specs: readonly TargetSpec[], chosen: Target[][] | undefined, ctx: Context): string | null {
  const got = chosen ?? [];
  if (got.length !== specs.length) return specs.length ? 'Choose targets' : 'This has no targets';
  for (const [i, spec] of specs.entries()) {
    const ts = got[i]!;
    const n = countOf(spec);
    const upTo = 'objects' in spec && spec.upTo;
    if (upTo ? ts.length > n : ts.length !== n) return `Choose ${upTo ? 'up to ' : ''}${n} target${n > 1 ? 's' : ''}`;
    if (new Set(ts).size !== ts.length) return 'The same target is chosen twice for one word "target"';
    for (const t of ts) if (!isLegalTarget(s, spec, ctx, t)) return 'Not a legal target';
  }
  return null;
}

/** Whether a spell or ability with these specs could be put on the stack at all: every required target has a choice. */
export function hasTargets(s: GameState, specs: readonly TargetSpec[], ctx: Context): boolean {
  return specs.every((spec) => ('objects' in spec && spec.upTo) || legalTargets(s, spec, ctx).length >= countOf(spec));
}

/** If every spec has exactly the choice it needs and no more, that choice; otherwise null. */
export function onlyChoice(s: GameState, specs: readonly TargetSpec[], ctx: Context): Target[][] | null {
  const out: Target[][] = [];
  for (const spec of specs) {
    const legal = legalTargets(s, spec, ctx);
    if ('objects' in spec && spec.upTo) return null;
    if (legal.length !== countOf(spec)) return null;
    out.push(legal);
  }
  return out;
}
