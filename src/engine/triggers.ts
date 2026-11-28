/**
 * Events and triggered abilities (CR 603). The engine reports what happens as events; each
 * triggered ability whose event matches waits in `pendingTriggers` until a player would receive
 * priority, and then goes on the stack (see engine.ts). Leaves-the-battlefield abilities "look
 * back in time" (603.10a): those events are fired before the objects leave, while they still exist.
 */
import type { Filter, TriggeredAbility, TriggerEvent } from './abilities';
import { view } from './characteristics';
import { holds, matches, type Context, type View } from './evaluate';
import type { GameObject, GameState, ObjectId, PlayerId, Step } from './types';

export type GameEventKind =
  | { kind: 'enters'; object: ObjectId }
  | { kind: 'dies'; object: ObjectId }
  | { kind: 'leaves'; object: ObjectId }
  | { kind: 'attacks'; object: ObjectId }
  | { kind: 'cast'; object: ObjectId; player: PlayerId }
  | { kind: 'step'; step: Step }
  | { kind: 'becomesTapped'; object: ObjectId }
  | { kind: 'dealsCombatDamageToPlayer'; object: ObjectId }
  | { kind: 'drew'; player: PlayerId; nth: number }
  | { kind: 'toGraveyard'; object: ObjectId }
  | { kind: 'countersPut'; object: ObjectId; counter: string; n: number; player: PlayerId };

/** The keyword library's triggered keywords (702): written once, used by every card that has them. */
const KEYWORD_TRIGGERS: Record<string, TriggeredAbility> = {
  // 702.108: Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.
  prowess: {
    when: { cast: { notTypes: ['Creature'] }, by: 'you' },
    effects: [{ pump: 'self', power: 1, toughness: 1, duration: 'endOfTurn' }],
    text: 'Prowess',
  },
};

/** Triggered abilities of an object: its script's, then its keywords'. Index ≥ 1000 is a keyword's. */
export function triggeredAbilities(s: GameState, o: GameObject, v: View): [number, TriggeredAbility][] {
  const c = v(o);
  if (c.abilitiesRemoved) return [];
  const own = (s.setup.cards[o.card]?.script?.triggered ?? []).map((t, i): [number, TriggeredAbility] => [i, t]);
  const kw = Object.keys(KEYWORD_TRIGGERS).flatMap((k, i): [number, TriggeredAbility][] =>
    (c.keywords.includes(k) ? [[1000 + i, KEYWORD_TRIGGERS[k]!]] : []));
  return [...own, ...kw];
}

/** Built-in delayed triggers, by index: the return of an earthbent land (701.65). */
export const EARTHBEND_RETURN = 2000;
/** Delayed and reflexive triggers created by effects: index DELAYED + k is s.delayed[k]. */
export const DELAYED = 3000;
const BUILT_IN: Record<number, TriggeredAbility> = {
  [EARTHBEND_RETURN]: {
    when: { leaves: {} }, effects: [{ returnToBattlefield: 'triggerObject', tapped: true }],
    text: 'When it dies or is exiled, return it to the battlefield tapped under your control.',
  },
};

export function triggeredAbility(s: GameState, card: string, index: number): TriggeredAbility {
  if (index >= DELAYED) return s.delayed[index - DELAYED]!.ability;
  if (BUILT_IN[index]) return BUILT_IN[index]!;
  if (index >= 1000) return KEYWORD_TRIGGERS[Object.keys(KEYWORD_TRIGGERS)[index - 1000]!]!;
  const t = s.setup.cards[card]?.script?.triggered?.[index];
  if (!t) throw new Error(`no triggered ability ${index} on ${card}`);
  return t;
}

function eventMatches(s: GameState, v: View, w: TriggerEvent, self: boolean | undefined, ev: GameEventKind, ctx: Context): boolean {
  const about = 'object' in ev ? s.objects[ev.object] : undefined;
  // The event's object is checked where it is when the event happens.
  const filterOn = (f: Filter) => !!about && (!self || about.id === ctx.source)
    && matches(s, v, about, { ...f, zone: about.zone === 'stack' ? 'stack' : 'battlefield' }, ctx);
  if ('enters' in w) return ev.kind === 'enters' && filterOn(w.enters);
  if ('dies' in w) return ev.kind === 'dies' && filterOn(w.dies);
  if ('leaves' in w) return (ev.kind === 'leaves' || ev.kind === 'dies') && filterOn(w.leaves);
  if ('attacks' in w) return ev.kind === 'attacks' && filterOn(w.attacks);
  if ('becomesTapped' in w) return ev.kind === 'becomesTapped' && filterOn(w.becomesTapped);
  if ('dealsCombatDamageToPlayer' in w) return ev.kind === 'dealsCombatDamageToPlayer' && filterOn(w.dealsCombatDamageToPlayer);
  if ('cast' in w) {
    if (ev.kind !== 'cast') return false;
    if (w.by === 'you' && ev.player !== ctx.controller) return false;
    if (w.by === 'opponent' && ev.player === ctx.controller) return false;
    return filterOn(w.cast);
  }
  if ('drawsNth' in w) return ev.kind === 'drew' && ev.player === ctx.controller && ev.nth === w.drawsNth;
  if ('toGraveyard' in w) return ev.kind === 'toGraveyard' && filterOn(w.toGraveyard);
  if ('countersPut' in w) return ev.kind === 'countersPut' && ev.counter === w.kind && ev.player === ctx.controller && filterOn(w.countersPut);
  if ('step' in w) return ev.kind === 'step' && ev.step === w.step && (w.whose === 'any' || s.active === ctx.controller);
  return false;
}

/** Reports an event: every matching triggered ability on the battlefield, and every delayed one, waits to go on the stack. */
export function fire(s: GameState, ev: GameEventKind): void {
  const v = view(s);
  const about = 'object' in ev ? { eventObject: ev.object } : {};
  const amount = ev.kind === 'countersPut' ? { eventAmount: ev.n } : {};
  const consider = (t: TriggeredAbility, ctx: Context, self: boolean | undefined) => {
    if (!eventMatches(s, v, t.when, self, ev, ctx)) return false;
    if (t.onlyIf && !holds(s, v, t.onlyIf, ctx)) return false;
    if (t.if && !holds(s, v, t.if, ctx)) return false; // 603.4: the intervening "if" is checked as it triggers
    return true;
  };
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    for (const [index, t] of triggeredAbilities(s, o, v)) {
      const ctx: Context = { controller: o.controller, source: o.id, ...about, ...amount };
      if (!consider(t, ctx, t.self)) continue;
      // "Whenever one or more …": the events that happen at once make one trigger.
      if (t.oneOrMore && s.pendingTriggers.some((p) => p.source === o.id && p.index === index)) continue;
      s.pendingTriggers.push({ controller: o.controller, source: o.id, sourceName: v(o).name, card: o.card, index, ...about, ...amount });
    }
  }
  s.delayed.forEach((d, k) => {
    if (d.done || (d.untilTurn !== undefined && s.turn > d.untilTurn)) return;
    if (d.about && (!('object' in ev) || ev.object !== d.about)) return;
    if (!consider(d.ability, { controller: d.controller, source: d.source, ...about, ...amount }, false)) return;
    d.done = true; // "When that creature dies this turn": once
    s.pendingTriggers.push({ controller: d.controller, source: d.source, sourceName: d.sourceName, card: d.card, index: DELAYED + k, ...about, ...amount });
  });
}
