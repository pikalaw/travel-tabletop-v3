/**
 * What an effect module works with while its effect resolves (608.2). Each module in this folder is
 * one mechanic: the effect's shape (a type) and what it does (a handler). The handler reads and
 * changes the game through a `Resolution`, and asks a player through `ask`, which pauses the
 * resolution; the answer comes back as `choice` on the next call, at the same place.
 */
import type { Amount, Continuous, Duration, Effect, ObjectRef, PlayerRef } from '../abilities';
import { characteristics, view } from '../characteristics';
import { amount, objects, type Context, type View } from '../evaluate';
import { event, obj } from '../state';
import type { Choice, Decision, GameObject, GameState, ObjectId, PlayerId, Target } from '../types';
import { other, PLAYERS } from '../types';

/** 'next' goes on to the following effect; 'wait' stops for the decision just asked. */
export type Outcome = 'next' | 'wait';

/** A mechanic's handler: runs effect `e`. Returning nothing means 'next'. */
export type Handler<E> = (e: E, r: Resolution) => Outcome | void;

export interface Resolution {
  s: GameState;
  ctx: Context;
  /** Current characteristics of an object (layers applied). */
  v: View;
  /** An amount, evaluated now. */
  n(a: Amount): number;
  players(ref: PlayerRef): PlayerId[];
  objs(ref: ObjectRef): GameObject[];
  /** The objects and players a reference names; a target may be either. */
  recipients(ref: ObjectRef | PlayerRef): Target[];
  playerName(p: PlayerId): string;
  cardName(id: ObjectId): string;
  log(text: string): void;
  /** The answer to this effect's decision, if it asked one: undefined the first time through. */
  answer<K extends Choice['kind']>(kind: K): Extract<Choice, { kind: K }> | undefined;
  /** The answer to a yes/no decision this effect asked ("may", "pay or else"): undefined the first time through. */
  agreed(): boolean | undefined;
  /** Asks a player; return its result ('wait'). */
  ask(d: Decision): 'wait';
  /** Runs these effects right after this one ("If you do, …", a "may" accepted). */
  then(effects: Effect[]): void;
  /** A continuous effect from this resolution (611.2), its affected set fixed now. */
  addEffect(effect: Omit<Continuous, 'affects'>, affected: ObjectId[], duration: Duration): void;
}

export const isPlayer = (t: Target): t is PlayerId => t === 'p1' || t === 'p2';

function contextOf(s: GameState): Context {
  const r = s.resolving!;
  return { controller: r.controller, source: r.source, targets: r.targets, ...(r.eventObject ? { eventObject: r.eventObject } : {}), ...(r.eventAmount !== undefined ? { eventAmount: r.eventAmount } : {}), ...(r.x !== undefined ? { x: r.x } : {}), ...(r.created ? { created: r.created } : {}), ...(r.attachedTo ? { attachedTo: r.attachedTo } : {}) };
}

/** The Resolution for the effect at s.resolving.pc, with the answer to its decision if there is one. */
export function resolution(s: GameState, choice: Choice | undefined): Resolution {
  const ctx = contextOf(s);
  const v = view(s);
  const players = (ref: PlayerRef): PlayerId[] => {
    if (ref === 'you') return [ctx.controller];
    if (ref === 'opponent') return [other(ctx.controller)];
    if (ref === 'each') return [...PLAYERS];
    return (ctx.targets?.[ref.target] ?? []).filter(isPlayer);
  };
  const objs = (ref: ObjectRef) => objects(s, v, ref, ctx);
  return {
    s, ctx, v, players, objs,
    n: (a) => amount(s, v, a, ctx),
    recipients: (ref) => {
      if (ref === 'you' || ref === 'opponent' || ref === 'each') return players(ref);
      if (typeof ref === 'object' && 'target' in ref) return (ctx.targets?.[ref.target] ?? []).filter((t) => isPlayer(t) || s.objects[t]);
      return objs(ref).map((o) => o.id);
    },
    playerName: (p) => s.setup.players[p].name,
    cardName: (id) => characteristics(s, obj(s, id)).name,
    log: (text) => event(s, text),
    answer: <K extends Choice['kind']>(kind: K) => {
      if (!choice) return undefined;
      if (choice.kind !== kind) throw new Error(`expected a "${kind}" answer, got "${choice.kind}"`);
      return choice as Extract<Choice, { kind: K }>;
    },
    agreed: () => {
      if (!choice) return undefined;
      if (choice.kind !== 'yes' && choice.kind !== 'no') throw new Error(`expected yes or no, got "${choice.kind}"`);
      return choice.kind === 'yes';
    },
    ask: (d) => { s.decision = d; return 'wait'; },
    then: (effects) => {
      const r = s.resolving!;
      r.effects = [...r.effects.slice(0, r.pc + 1), ...effects, ...r.effects.slice(r.pc + 1)];
    },
    addEffect: (effect, affected, duration) => {
      const src = s.objects[ctx.source];
      s.effects.push({ effect: { affects: 'self', ...effect }, affected, timestamp: s.nextTimestamp++, duration, controller: ctx.controller, source: ctx.source, ...(src ? { sourceName: characteristics(s, src).name } : {}) });
    },
  };
}
