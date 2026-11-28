/**
 * Evaluating the vocabulary's filters, numbers and conditions against a state. Each function takes
 * a `view` that gives an object's characteristics, so the layer system can evaluate them partway
 * through its own computation (613: what an effect sees is the result of the layers before it).
 */
import type { Amount, Condition, Filter, ObjectRef } from './abilities';
import { manaValue } from './mana';
import type { Color, GameObject, GameState, ObjectId, PlayerId, Target } from './types';

export interface Characteristics {
  name: string;
  supertypes: string[];
  types: string[];
  subtypes: string[];
  power: number;
  toughness: number;
  keywords: string[];
  colors: Color[];
  /** Has a "{T}: Add …" mana ability from an effect (layer 6). */
  addsMana?: { makes: (Color | 'C')[]; n?: number };
  /** Lost all abilities (layer 6): its static, triggered and activated abilities don't work. */
  abilitiesRemoved: boolean;
  /** Where power and toughness came from, in layer order (PRD, "Auto-tallied numbers"). */
  parts: PtPart[];
}

/** One step of a power and toughness breakdown: "printed 2/4", "+1/+1 counter", "+1/+1 from Iroh until end of turn". */
export interface PtPart { label: string; power: number; toughness: number; set?: boolean }

export type View = (o: GameObject) => Characteristics;

/** Who an ability belongs to, what it is, and what it's about: what "you", "~" and "it" mean. */
export interface Context {
  controller: PlayerId;
  source: ObjectId;
  targets?: Target[][];
  eventObject?: ObjectId;
  /** The value chosen for X. */
  x?: number;
  created?: ObjectId;
  /** What the source was attached to when its ability was activated (it may have been sacrificed since). */
  attachedTo?: ObjectId;
  /** "That much": the amount the trigger's event was about. */
  eventAmount?: number;
  /** In a static effect's amount, the object it's being applied to. */
  affected?: ObjectId;
  /** The spell or ability a trigger's event came from (ward's "that spell"). */
  eventSource?: ObjectId;
  /** What this resolution's last choice picked, and the cards it discarded. */
  chosen?: ObjectId[];
  discarded?: ObjectId[];
}

const zoneName = (o: GameObject) => (o.zone.includes('.') ? o.zone.split('.')[1]! : o.zone);
const cmp = (v: number, c: { op: '<=' | '>=' | '=='; n: number }) => (c.op === '<=' ? v <= c.n : c.op === '>=' ? v >= c.n : v === c.n);

export function matches(s: GameState, view: View, o: GameObject, f: Filter, ctx: Context): boolean {
  if (zoneName(o) !== (f.zone ?? 'battlefield')) return false;
  if (o.ability) return false; // abilities on the stack are not objects a filter selects
  const c = view(o);
  if (f.types && !f.types.some((t) => c.types.includes(t))) return false;
  if (f.notTypes && f.notTypes.some((t) => c.types.includes(t))) return false;
  if (f.allTypes && !f.allTypes.every((t) => c.types.includes(t))) return false;
  if (f.token !== undefined && !!s.setup.cards[o.card]?.token !== f.token) return false;
  if (f.subtypes && !f.subtypes.some((t) => c.subtypes.includes(t))) return false;
  if (f.notSubtypes && f.notSubtypes.some((t) => c.subtypes.includes(t))) return false;
  if (f.supertypes && !f.supertypes.some((t) => c.supertypes.includes(t))) return false;
  if (f.controller === 'you' && o.controller !== ctx.controller) return false;
  if (f.controller === 'opponent' && o.controller === ctx.controller) return false;
  if (f.other && o.id === ctx.source) return false;
  if (f.self && o.id !== ctx.source) return false;
  if (f.attached && o.id !== (ctx.attachedTo ?? s.objects[ctx.source]?.attachedTo)) return false;
  if (f.tapped !== undefined && o.tapped !== f.tapped) return false;
  if (f.attacking !== undefined && (o.attacking !== undefined) !== f.attacking) return false;
  if (f.blocking !== undefined && (o.blocking !== undefined) !== f.blocking) return false;
  if (f.keyword && !c.keywords.includes(f.keyword)) return false;
  if (f.notKeyword && c.keywords.includes(f.notKeyword)) return false;
  if (f.colors && !f.colors.some((x) => c.colors.includes(x))) return false;
  if (f.withCounter && !(f.withCounter === '*' ? Object.values(o.counters).some((n) => n > 0) : o.counters[f.withCounter]! > 0)) return false;
  if (f.sharesCreatureTypeWith) {
    const mine = c.types.includes('Creature') ? c.subtypes : [];
    if (!select(s, view, f.sharesCreatureTypeWith, ctx).some((x) => view(x).subtypes.some((t) => mine.includes(t)))) return false;
  }
  if (f.noCounters && Object.values(o.counters).some((n) => n > 0)) return false;
  if (f.anyOf && !f.anyOf.some((g) => matches(s, view, o, { ...g, zone: f.zone ?? 'battlefield' }, ctx))) return false;
  if (f.controlledByTarget !== undefined && !(ctx.targets?.[f.controlledByTarget] ?? []).includes(o.controller)) return false;
  if (f.power && !cmp(c.power, f.power)) return false;
  if (f.toughness && !cmp(c.toughness, f.toughness)) return false;
  if (f.manaValue && !cmp(manaValue(s.setup.cards[o.card]!.manaCost), f.manaValue)) return false;
  return true;
}

/** The objects in the zones a filter looks at that match it. */
export function select(s: GameState, view: View, f: Filter, ctx: Context): GameObject[] {
  const zone = f.zone ?? 'battlefield';
  const ids = zone === 'battlefield' || zone === 'stack' ? s.zones[zone]
    : [...s.zones[`p1.${zone}`], ...s.zones[`p2.${zone}`]];
  return ids.map((id) => s.objects[id]!).filter((o) => matches(s, view, o, f, ctx));
}

/** The objects an ObjectRef names, as they are now. Targets that left their zone are gone. */
export function objects(s: GameState, view: View, ref: ObjectRef, ctx: Context): GameObject[] {
  if (ref === 'self') return s.objects[ctx.source] ? [s.objects[ctx.source]!] : [];
  if (ref === 'triggerObject') return ctx.eventObject && s.objects[ctx.eventObject] ? [s.objects[ctx.eventObject]!] : [];
  if (ref === 'created') return ctx.created && s.objects[ctx.created] ? [s.objects[ctx.created]!] : [];
  if (ref === 'affected') return ctx.affected && s.objects[ctx.affected] ? [s.objects[ctx.affected]!] : [];
  if (ref === 'eventSource') return ctx.eventSource && s.objects[ctx.eventSource] ? [s.objects[ctx.eventSource]!] : [];
  if (typeof ref === 'object' && 'ids' in ref) return ref.ids.flatMap((id) => (s.objects[id] ? [s.objects[id]!] : []));
  if (ref === 'chosen') return (ctx.chosen ?? []).flatMap((id) => (s.objects[id] ? [s.objects[id]!] : []));
  if (ref === 'thisCard') {
    const id = s.objects[ctx.source] ? ctx.source : s.lastKnown[ctx.source]?.movedTo;
    return id && s.objects[id] ? [s.objects[id]!] : [];
  }
  if (ref === 'attachedTo') {
    const to = ctx.attachedTo ?? s.objects[ctx.source]?.attachedTo;
    return to && s.objects[to] ? [s.objects[to]!] : [];
  }
  if ('target' in ref) return (ctx.targets?.[ref.target] ?? []).flatMap((t) => (s.objects[t] ? [s.objects[t]!] : []));
  return select(s, view, ref.all, ctx);
}

/** The counters on what a reference names; for the source or the event's object gone from the battlefield, as it last existed. */
export function countersOf(s: GameState, view: View, ref: ObjectRef, ctx: Context): Record<string, number>[] {
  const gone = ref === 'self' ? ctx.source : ref === 'triggerObject' ? ctx.eventObject : undefined;
  if (gone && !s.objects[gone] && s.lastKnown[gone]) return [s.lastKnown[gone]!.counters];
  return objects(s, view, ref, ctx).map((o) => o.counters);
}

export function amount(s: GameState, view: View, a: Amount, ctx: Context, x = ctx.x ?? 0): number {
  if (typeof a === 'number') return a;
  if (a === 'x') return x;
  if (a === 'eventAmount') return ctx.eventAmount ?? 0;
  if ('playerCounters' in a) return s.players[ctx.controller].counters[a.playerCounters] ?? 0;
  if ('creatureTypesOf' in a) {
    // Creature types are the subtypes of a creature (205.3m); the pool has no changelings.
    const n = objects(s, view, a.creatureTypesOf, ctx).reduce((k, o) => k + (view(o).types.includes('Creature') ? view(o).subtypes.length : 0), 0);
    return a.max === undefined ? n : Math.min(n, a.max);
  }
  if ('count' in a) return select(s, view, a.count, ctx).length;
  if ('counters' in a) return countersOf(s, view, a.on, ctx).reduce((n, c) => n + (a.counters === '*' ? Object.values(c).reduce((x, y) => x + y, 0) : c[a.counters] ?? 0), 0);
  if ('powerOf' in a) return objects(s, view, a.powerOf, ctx).reduce((n, o) => n + view(o).power, 0);
  if ('manaValueOf' in a) return objects(s, view, a.manaValueOf, ctx).reduce((n, o) => n + manaValue(s.setup.cards[o.card]!.manaCost), 0);
  if ('times' in a) return amount(s, view, a.times, ctx, x) * a.by;
  if ('half' in a) return Math.ceil(amount(s, view, a.half, ctx, x) / 2);
  return amount(s, view, a.plus, ctx, x) + a.and;
}

export function holds(s: GameState, view: View, c: Condition, ctx: Context): boolean {
  if (c === 'yourTurn') return s.active === ctx.controller;
  if (c === 'firstTapThisTurn') return !!ctx.eventObject && s.turnLog.tapped[ctx.eventObject] === 1;
  if (c === 'duringCombat') return ['beginCombat', 'attackers', 'blockers', 'firstStrikeDamage', 'damage', 'endCombat'].includes(s.step);
  if ('not' in c) return !holds(s, view, c.not, ctx);
  if ('any' in c) return c.any.some((x) => holds(s, view, x, ctx));
  if ('drawnThisTurn' in c) return s.turnLog.drawn[ctx.controller] >= c.drawnThisTurn;
  if ('chosen' in c) return (ctx.chosen ?? []).some((id) => !!s.objects[id] && matches(s, view, s.objects[id]!, { ...c.chosen, zone: c.chosen.zone ?? 'graveyard' }, ctx));
  if ('costPaid' in c) return s.objects[ctx.source]?.castWith === c.costPaid;
  if ('discarded' in c) return (ctx.discarded ?? []).some((id) => !!s.objects[id] && matches(s, view, s.objects[id]!, { ...c.discarded, zone: c.discarded.zone ?? 'graveyard' }, ctx));
  if ('all' in c) return c.all.every((x) => holds(s, view, x, ctx));
  if ('exists' in c) return select(s, view, c.exists, ctx).length > 0;
  if ('xAtLeast' in c) return (ctx.x ?? 0) >= c.xAtLeast;
  if ('thisTurn' in c) {
    if (c.thisTurn === 'youAttacked') return s.turnLog.attacked[ctx.controller];
    if (c.thisTurn === 'aLandEnteredForYou') return s.turnLog.landsEntered[ctx.controller] > 0;
    return Object.entries(s.turnLog.lifeLost).some(([p, n]) => p !== ctx.controller && n > 0);
  }
  if ('target' in c) {
    const t = ctx.targets?.[c.target]?.[0];
    const o = t ? s.objects[t] : undefined;
    return !!o && matches(s, view, o, { ...c.is, zone: c.is.zone ?? 'battlefield' }, ctx);
  }
  return amount(s, view, c.atLeast, ctx) >= c.n;
}
