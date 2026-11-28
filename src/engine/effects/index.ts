/**
 * The effect vocabulary and its interpreter (608.2). Each mechanic is a module in this folder: its
 * effect's shape and a handler, named for the effect's key ({ draw: 'you', n: 2 } runs `draw`).
 * Adding a mechanic is adding a module and listing it twice below: in `Effect` and in `HANDLERS`.
 * The type checker refuses an effect without a handler.
 *
 * Effects run in order from s.resolving.pc. One that needs a player's choice asks and stops; the
 * answer resumes it at the same place. `s.resolving` holds where it is, as plain data.
 */
import type { Choice, GameState } from '../types';
import { airbend, type Airbend } from './airbend';
import { attach, type Attach } from './attach';
import { conditional, may, unlessPays, type If, type May, type UnlessPays } from './choices';
import { continuous, exileIfWouldDie, grant, pump, type Continuous, type ExileIfWouldDie, type Grant, type Pump } from './continuous';
import { counterSpell, counterUnlessPays, type CounterSpell, type CounterUnlessPays } from './counter-spell';
import { addCounters, putCountersOf, removeAnyCounters, removeCounters, type AddCounters, type PutCountersOf, type RemoveAnyCounters, type RemoveCounters } from './counters';
import { castFromHand, type CastFromHand } from './cast-from-hand';
import { copySelf, type CopySelf } from './copy-self';
import { exileCastable, type ExileCastable } from './exile-castable';
import { modal, type Modal } from './modal';
import { choose, type Choose } from './choose';
import { distributeCounters, type DistributeCounters } from './distribute';
import { exileReturns, type ExileReturns } from './exile-returns';
import { toLibraryTop, type ToLibraryTop } from './to-library-top';
import { damage, type Damage } from './damage';
import { delayed, reflexive, type Delayed, type Reflexive } from './delayed';
import { eachDeals, type EachDeals } from './each-deals';
import { playerCounter, type PlayerCounter } from './player-counters';
import { topCard, type TopCard } from './top-card';
import { toOwnersLibrary, type ToOwnersLibrary } from './to-library';
import { discard, type Discard } from './discard';
import { draw, type Draw } from './draw';
import { earthbend, type Earthbend } from './earthbend';
import { fight, type Fight } from './fight';
import { resolution, type Handler } from './kit';
import { exileTopPlayable, mill, shuffleIntoLibrary, type ExileTopPlayable, type Mill, type ShuffleIntoLibrary } from './library';
import { gainLife, loseLife, type GainLife, type LoseLife } from './life';
import { lookAtTop, type LookAtTop } from './look-at-top';
import { addMana, type AddMana } from './mana';
import { optional, type Optional } from './optional';
import { bounce, destroy, exile, sacrifice, type Bounce, type Destroy, type Exile, type Sacrifice } from './removal';
import { returnToBattlefield, type ReturnToBattlefield } from './return-to-battlefield';
import { revealAndDiscard, type RevealAndDiscard } from './reveal-and-discard';
import { scry, surveil, type Scry, type Surveil } from './scry';
import { search, type Search } from './search';
import { tap, untap, type Tap, type Untap } from './tapping';
import { createToken, type CreateToken } from './tokens';
import { extraLand, type ExtraLand } from './turn';

export { dealDamage } from './damage';

export type Effect =
  | Draw | Discard | Damage | GainLife | LoseLife
  | AddCounters | RemoveCounters | RemoveAnyCounters | PutCountersOf
  | Pump | Grant | Continuous | ExileIfWouldDie
  | Destroy | Exile | Bounce | Sacrifice | Tap | Untap
  | CreateToken | AddMana | Earthbend | Airbend | ReturnToBattlefield | Attach
  | Mill | ExileTopPlayable | ShuffleIntoLibrary | Scry | Surveil | Search | LookAtTop | RevealAndDiscard
  | ExtraLand | Optional | Fight | CounterSpell | CounterUnlessPays
  | May | UnlessPays | If
  | Delayed | Reflexive | EachDeals | PlayerCounter | TopCard | Choose | ToOwnersLibrary
  | DistributeCounters | ExileReturns | ToLibraryTop | CastFromHand
  | ExileCastable | Modal | CopySelf;

const HANDLERS = {
  draw, discard, damage, gainLife, loseLife,
  addCounters, removeCounters, removeAnyCounters, putCountersOf,
  pump, grant, continuous, exileIfWouldDie,
  destroy, exile, bounce, sacrifice, tap, untap,
  createToken, addMana, earthbend, airbend, returnToBattlefield, attach,
  mill, exileTopPlayable, shuffleIntoLibrary, scry, surveil, search, lookAtTop, revealAndDiscard,
  extraLand, optional, fight, counterSpell, counterUnlessPays,
  may, unlessPays, if: conditional,
  delayed, reflexive, eachDeals, playerCounter, topCard, choose, toOwnersLibrary,
  distributeCounters, exileReturns, toLibraryTop, castFromHand,
  exileCastable, modal, copySelf,
} satisfies Record<string, Handler<never>>;

type Key = keyof typeof HANDLERS;

/** Fails to compile if an effect in `Effect` has no handler keyed by one of its fields. */
type Unhandled = Exclude<Effect, { [K in Key]: Record<K, unknown> }[Key]>;
const everyEffectHandled: [Unhandled] extends [never] ? true : Unhandled = true;
void everyEffectHandled;

/** The key naming an effect's mechanic: exactly one of its fields is a handler's name. */
export function keyOf(e: Effect): Key {
  const keys = Object.keys(e).filter((k): k is Key => k in HANDLERS);
  if (keys.length !== 1) throw new Error(`an effect needs exactly one mechanic, got ${JSON.stringify(e)}`);
  return keys[0]!;
}

/** Runs effects from s.resolving.pc. Returns 'wait' when a decision is needed, 'done' at the end. */
export function runEffects(s: GameState, choice?: Choice): 'done' | 'wait' {
  const r = s.resolving!;
  while (r.pc < r.effects.length) {
    const e = r.effects[r.pc]!;
    const handler = HANDLERS[keyOf(e)] as Handler<Effect>;
    const result = handler(e, resolution(s, choice)) ?? 'next';
    choice = undefined;
    if (result === 'wait') return 'wait';
    r.pc++;
  }
  return 'done';
}
