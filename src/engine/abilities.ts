/**
 * The effect vocabulary (technical design, "Cards"): a card's abilities as plain data that the
 * engine interprets. Scripts in src/cards/scripts build these values; the engine never runs card
 * code, so a game's setup, abilities included, stays serializable and replays exactly.
 *
 * The vocabulary starts with what the generic rules need (M2) and grows one tested building block
 * at a time as cards need them (M4). A card that needs something new adds it here, never a one-off.
 */
import type { Color, PlayerId, Step } from './types';

// ----- Which objects and players --------------------------------------------------------------

/** Players, relative to an ability's controller. */
export type PlayerRef = 'you' | 'opponent' | 'each' | { target: number };

/** A filter over objects. Every field present must hold. */
export interface Filter {
  types?: string[];          // any of these card types
  allTypes?: string[];       // every one of these ("land creature")
  token?: boolean;           // a token, or (false) a nontoken
  subtypes?: string[];       // any of these subtypes
  supertypes?: string[];
  notTypes?: string[];
  controller?: 'you' | 'opponent';
  other?: boolean;           // not the ability's source
  self?: boolean;            // the ability's source itself ("if ~ is tapped")
  tapped?: boolean;
  attacking?: boolean;
  blocking?: boolean;
  keyword?: string;
  notKeyword?: string;
  colors?: Color[];          // any of these colours
  withCounter?: string;
  noCounters?: boolean;
  /** Any of these filters (for "attacking or blocking creature"); combined with the fields above. */
  anyOf?: Filter[];
  /** Controlled by the player chosen for the n-th target spec ("creatures target player controls"). */
  controlledByTarget?: number;      // has at least one counter of this kind
  power?: Compare;
  toughness?: Compare;
  manaValue?: Compare;
  /** Default battlefield. */
  zone?: 'battlefield' | 'graveyard' | 'hand' | 'stack' | 'exile';
}
export interface Compare { op: '<=' | '>=' | '=='; n: number }

/** The objects an effect acts on. */
export type ObjectRef =
  | 'self'
  | { target: number }               // the n-th target spec's chosen objects
  | { all: Filter }
  | 'triggerObject'                  // the object the trigger's event is about
  | 'attachedTo';                    // what this Aura or Equipment is attached to

// ----- Numbers ---------------------------------------------------------------------------------

export type Amount =
  | number
  | { count: Filter }
  | { counters: string; on: ObjectRef }
  | { powerOf: ObjectRef }
  | { manaValueOf: ObjectRef }
  | 'x'
  | { times: Amount; by: number }
  | { plus: Amount; and: number };

// ----- Conditions ------------------------------------------------------------------------------

export type Condition =
  | { atLeast: Amount; n: number }
  | { not: Condition }
  | { all: Condition[] }
  | 'yourTurn'
  | { exists: Filter };

// ----- Durations -------------------------------------------------------------------------------

export type Duration = 'endOfTurn' | 'endOfCombat' | 'permanent';

// ----- Effects ---------------------------------------------------------------------------------

export type Effect =
  | { draw: PlayerRef; n: Amount }
  | { discard: PlayerRef; n: Amount }
  | { damage: Amount; to: ObjectRef | PlayerRef; from?: ObjectRef }
  | { gainLife: PlayerRef; n: Amount }
  | { loseLife: PlayerRef; n: Amount }
  | { addCounters: string; n: Amount; on: ObjectRef }
  | { removeCounters: string; n: Amount; on: ObjectRef }
  | { pump: ObjectRef; power: Amount; toughness: Amount; duration: Duration }
  /** Any continuous effect on these objects for a duration: "loses all abilities and is 1/1 until end of turn". */
  | { continuous: Omit<Continuous, 'affects'>; on: ObjectRef; duration: Duration }
  | { exileIfWouldDie: ObjectRef; duration: Duration }
  | { grant: ObjectRef; keywords: string[]; duration: Duration }
  | { destroy: ObjectRef }
  | { exile: ObjectRef }
  | { bounce: ObjectRef }
  | { tap: ObjectRef }
  | { untap: ObjectRef }
  | { sacrifice: ObjectRef }
  | { createToken: string; n: Amount; controller?: PlayerRef; tapped?: boolean; attacking?: boolean }
  | { addMana: (Color | 'C')[]; n?: Amount; anyColor?: boolean; untilEndOfCombat?: boolean }
  /** Earthbend N (701.65): the target land becomes a 0/0 creature with haste that's still a land, gets N +1/+1 counters, and returns tapped when it dies or is exiled. */
  | { earthbend: Amount; on: ObjectRef }
  /** Airbend (701.66): exile it; while exiled, its owner may cast it for {2}. A token airbended ceases to exist. */
  | { airbend: ObjectRef }
  | { returnToBattlefield: ObjectRef; tapped?: boolean }
  | { mill: PlayerRef; n: Amount }
  | { counterSpell: ObjectRef }
  | { may: Effect[] }
  | { if: Condition; then: Effect[]; else?: Effect[] };

/** What may be targeted: a filter over objects, or players. */
export type TargetSpec =
  | { objects: Filter; count?: number; upTo?: boolean }
  | { players: 'any' | 'opponent' }
  | { any: true };          // "any target": a creature, a player (no planeswalkers or battles in the pool)

// ----- Abilities --------------------------------------------------------------------------------

export interface Cost {
  mana?: string;             // e.g. "{2}{R}"
  /** Waterbend {N} (701.67): generic mana you may pay in part by tapping your untapped artifacts and creatures, one each. */
  waterbend?: number;
  tap?: boolean;
  sacrificeSelf?: boolean;
  payLife?: number;
}

export interface SpellAbility {
  targets?: TargetSpec[];
  effects: Effect[];
  /** An additional cost to cast it (601.2f), such as "waterbend {5}". */
  additionalCost?: Cost;
}

export interface ActivatedAbility {
  cost: Cost;
  targets?: TargetSpec[];
  effects: Effect[];
  /** "Activate only as a sorcery", "only once each turn", "only during your turn". */
  timing?: 'sorcery' | 'yourTurn';
  oncePerTurn?: boolean;
  /** A mana ability (605): no targets, makes mana, doesn't use the stack. */
  mana?: boolean;
  /** Exhaust (702.177): activate each only once. */
  exhaust?: boolean;
  text: string;
}

export type TriggerEvent =
  | { enters: Filter }                         // "When ~ enters" is { enters: {}, self }
  | { dies: Filter }
  | { leaves: Filter }
  | { attacks: Filter }
  | { cast: Filter; by: 'you' | 'opponent' | 'any' }
  | { step: Step; whose: 'yours' | 'any' }
  | { becomesTapped: Filter }
  | { dealsCombatDamageToPlayer: Filter };

export interface TriggeredAbility {
  when: TriggerEvent;
  /** The event must be about this object ("When ~ enters", "Whenever ~ attacks"). */
  self?: boolean;
  /** Part of the trigger event, checked only as it triggers ("Whenever ~ and at least one other creature attack"). */
  onlyIf?: Condition;
  /** An intervening "if" clause (603.4): checked when it triggers and again on resolution. */
  if?: Condition;
  targets?: TargetSpec[];
  effects: Effect[];
  text: string;
}

/** A continuous effect a static ability (or a resolved spell) creates, by layer (613). */
export interface Continuous {
  affects: ObjectRef;
  /** 4: types added, or set (replacing card types and subtypes). */
  addTypes?: string[];
  addSubtypes?: string[];
  setTypes?: { types: string[]; subtypes: string[] };
  /** 3 (text): a new name. */
  setName?: string;
  /** 6: abilities added, or all removed. */
  addKeywords?: string[];
  removeAllAbilities?: boolean;
  /** 7a: a characteristic-defining ability setting power ("~'s power is equal to …"). */
  cdaPower?: Amount;
  /** 7b: base power and toughness set, or base power alone. */
  setBase?: [number, number];
  setBasePower?: number;
  /** 7c: power and toughness changed. */
  modify?: [Amount, Amount];
  /** Not a characteristic but a replacement with a duration: "if it would die this turn, exile it instead". */
  exileIfWouldDie?: boolean;
  /** Earthbent: when this land dies or is exiled, it returns to the battlefield tapped (701.65). */
  earthbent?: boolean;
}

export interface StaticAbility { effect: Continuous; while?: Condition; text: string }

/** Replacement effects (614), applied as the event is about to happen. */
export type Replacement =
  | { entersTapped: true }                                   // this permanent
  | { entersWithCounters: string; n: number }               // this permanent
  | { moreCounters: string; extra: number; on: Filter };    // Solid Ground

export interface StaticReplacement { replace: Replacement; text: string }

/** Everything a card does beyond its printed characteristics. */
export interface CardScript {
  oracleId: string;
  name: string;
  spell?: SpellAbility;
  statics?: StaticAbility[];
  replacements?: StaticReplacement[];
  triggered?: TriggeredAbility[];
  activated?: ActivatedAbility[];
}

/** Players referred to by a script, resolved against the controller. */
export const resolvePlayer = (ref: 'you' | 'opponent', controller: PlayerId): PlayerId =>
  ref === 'you' ? controller : controller === 'p1' ? 'p2' : 'p1';
