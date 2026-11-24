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
  | { kind: 'dealsCombatDamageToPlayer'; object: ObjectId };

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

export function triggeredAbility(s: GameState, card: string, index: number): TriggeredAbility {
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
  if ('step' in w) return ev.kind === 'step' && ev.step === w.step && (w.whose === 'any' || s.active === ctx.controller);
  return false;
}

/** Reports an event: every matching triggered ability on the battlefield waits to go on the stack. */
export function fire(s: GameState, ev: GameEventKind): void {
  const v = view(s);
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    for (const [index, t] of triggeredAbilities(s, o, v)) {
      const ctx: Context = { controller: o.controller, source: o.id, ...('object' in ev ? { eventObject: ev.object } : {}) };
      if (!eventMatches(s, v, t.when, t.self, ev, ctx)) continue;
      if (t.if && !holds(s, v, t.if, ctx)) continue; // 603.4: the intervening "if" is checked as it triggers
      s.pendingTriggers.push({
        controller: o.controller, source: o.id, sourceName: v(o).name, card: o.card, index,
        ...('object' in ev ? { eventObject: ev.object } : {}),
      });
    }
  }
}
