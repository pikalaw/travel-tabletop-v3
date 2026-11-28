/**
 * The effect vocabulary (technical design, "Cards"): a card's abilities as plain data that the
 * engine interprets. Scripts in src/cards/scripts build these values; the engine never runs card
 * code, so a game's setup, abilities included, stays serializable and replays exactly.
 *
 * The vocabulary starts with what the generic rules need (M2) and grows one tested building block
 * at a time as cards need them (M4). A card that needs something new adds it here, never a one-off.
 */
import type { Effect } from './effects';
import type { Color, Step } from './types';

// ----- Which objects and players --------------------------------------------------------------

/** Players, relative to an ability's controller. */
export type PlayerRef = 'you' | 'opponent' | 'each' | { target: number };

/** A filter over objects. Every field present must hold. */
export interface Filter {
  types?: string[];          // any of these card types
  allTypes?: string[];       // every one of these ("land creature")
  token?: boolean;           // a token, or (false) a nontoken
  subtypes?: string[];       // any of these subtypes
  notSubtypes?: string[];
  supertypes?: string[];
  notTypes?: string[];
  controller?: 'you' | 'opponent';
  other?: boolean;           // not the ability's source
  self?: boolean;            // the ability's source itself ("if ~ is tapped")
  attached?: boolean;        // what the source Aura or Equipment is attached to ("enchanted creature")
  tapped?: boolean;
  attacking?: boolean;
  blocking?: boolean;
  keyword?: string;
  notKeyword?: string;
  colors?: Color[];          // any of these colours
  /** Has a counter of this kind ("*": any counter). */
  withCounter?: string;
  noCounters?: boolean;
  /** Any of these filters (for "attacking or blocking creature"); combined with the fields above. */
  anyOf?: Filter[];
  /** Controlled by the player chosen for the n-th target spec ("creatures target player controls"). */
  controlledByTarget?: number;      // has at least one counter of this kind
  /** Shares a creature type with an object matching this filter ("a creature you control"). */
  sharesCreatureTypeWith?: Filter;
  power?: Compare;
  toughness?: Compare;
  manaValue?: Compare;
  /** Default battlefield. */
  zone?: 'battlefield' | 'graveyard' | 'hand' | 'stack' | 'exile' | 'library';
}
export interface Compare { op: '<=' | '>=' | '=='; n: number }

/** The objects an effect acts on. */
export type ObjectRef =
  | 'self'
  | { target: number }               // the n-th target spec's chosen objects
  | { all: Filter }
  | 'triggerObject'                  // the object the trigger's event is about
  | 'attachedTo'                     // what this Aura or Equipment is attached to
  | 'created'                        // the token this effect list created last ("put a counter on it")
  | 'affected';                      // in a static effect's amount: the object it's being applied to ("each of its creature types")

// ----- Numbers ---------------------------------------------------------------------------------

export type Amount =
  | number
  | { count: Filter }
  /** Counters of a kind ("*": every kind) on objects, or on one as it last existed if it left (608.2h). */
  | { counters: string; on: ObjectRef }
  | { powerOf: ObjectRef }
  | { manaValueOf: ObjectRef }
  | 'x'
  /** "That much": the amount the trigger's event was about (counters put). */
  | 'eventAmount'
  /** Counters of a kind on the ability's controller (experience). */
  | { playerCounters: string }
  /** How many creature types an object has, up to `max` (after type-changing effects). */
  | { creatureTypesOf: ObjectRef; max?: number }
  | { times: Amount; by: number }
  | { plus: Amount; and: number };

// ----- Conditions ------------------------------------------------------------------------------

export type Condition =
  | { atLeast: Amount; n: number }
  | { xAtLeast: number }
  /** The object chosen for a target spec matches a filter ("if it has power 4 or greater"). */
  | { target: number; is: Filter }
  /** What happened this turn (raid, "if an opponent lost life this turn"). */
  | { thisTurn: 'youAttacked' | 'opponentLostLife' }
  | { not: Condition }
  | { all: Condition[] }
  | 'yourTurn'
  /** The trigger's object became tapped for the first time this turn. */
  | 'firstTapThisTurn'
  | { exists: Filter };

// ----- Durations -------------------------------------------------------------------------------

export type Duration = 'endOfTurn' | 'endOfCombat' | 'permanent';

// ----- Effects ---------------------------------------------------------------------------------

/** What spells and abilities do: one module per mechanic, in ./effects. */
export type { Effect } from './effects';

/** What may be targeted: a filter over objects, or players. */
export type TargetSpec =
  | { objects: Filter; count?: number; upTo?: boolean }
  | { players: 'any' | 'opponent' }
  | { any: true };          // "any target": a creature, a player (no planeswalkers or battles in the pool)

// ----- Abilities --------------------------------------------------------------------------------

export interface Cost {
  mana?: string;             // e.g. "{2}{R}"
  /** Discard this card (cycling, from the hand). */
  discardSelf?: boolean;
  /** Waterbend {N} (701.67): generic mana you may pay in part by tapping your untapped artifacts and creatures, one each. */
  waterbend?: number;
  tap?: boolean;
  sacrificeSelf?: boolean;
  payLife?: number;
  /** "Tap an untapped creature you control" (not {T}: summoning sickness doesn't matter). */
  tapAnother?: Filter;
  /** "Sacrifice an artifact or creature": the caster chooses one matching this filter. */
  sacrifice?: Filter;
}

/** One mode of a modal spell (700.2): its own targets and effects, target indices local to it. */
export interface Mode { targets?: TargetSpec[]; effects: Effect[]; text: string }

export interface SpellAbility {
  targets?: TargetSpec[];
  effects: Effect[];
  /** An Aura spell (303.4a): what it can enchant, which is its target. */
  enchant?: Filter;
  /** A modal spell: how many modes to choose (`max` with `min` 1 is "one or both"), and the modes. */
  modes?: { min: number; max: number; options: Mode[] };
  /** An additional cost to cast it (601.2f), such as "waterbend {5}". */
  additionalCost?: Cost;
  /** "As an additional cost, pay {4} or sacrifice an artifact or creature": the caster chooses one (601.2b). */
  costOptions?: { cost: Cost; text: string }[];
  /** "This spell costs {1} less to cast for each …" (601.2f): generic reduced, never below zero. */
  reduceBy?: Amount;
  /** "You may cast this spell as though it had flash if …" */
  flashIf?: Condition;
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
  /** Mana with a rider (Animal Attendant): spent on a spell matching `spentOn`, that permanent enters with an extra counter. */
  rider?: { spentOn: Filter; counter: string };
  /** Where the card must be to activate it; default the battlefield (cycling: the hand). */
  zone?: 'hand' | 'graveyard';
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
  | { dealsCombatDamageToPlayer: Filter }
  /** "Whenever you draw your second card each turn". */
  | { drawsNth: number }
  /** A permanent put into a graveyard from the battlefield, creature or not. */
  | { toGraveyard: Filter }
  /** "Whenever you put one or more +1/+1 counters on a creature": counters of `kind` put by an effect `you` control. */
  | { countersPut: Filter; kind: string }
  /** A reflexive trigger's (603.12): it never matches an event; its effect puts it on the stack. */
  | { reflexive: true };

export interface TriggeredAbility {
  when: TriggerEvent;
  /** The event must be about this object ("When ~ enters", "Whenever ~ attacks"). */
  self?: boolean;
  /** Part of the trigger event, checked only as it triggers ("Whenever ~ and at least one other creature attack"). */
  onlyIf?: Condition;
  /** "Whenever one or more …": one trigger for all the events that happen at once (one combat damage step, one declaration). */
  oneOrMore?: boolean;
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
  /** "Has '{T}: Add one mana of any color'" (Great Divide Guide): tapping it can make any colour. */
  anyColorMana?: boolean;
  /** Earthbent: when this land dies or is exiled, it returns to the battlefield tapped (701.65). */
  earthbent?: boolean;
}

export interface StaticAbility { effect: Continuous; while?: Condition; text: string }

/** Replacement effects (614), applied as the event is about to happen. */
export type Replacement =
  | { entersTapped: true }                                   // this permanent
  | { entersChoosingColor: { except?: Color } }             // "As it enters, choose a color other than red"
  | { untapsEachUntapStep: true }                            // Bender's Waterskin: untaps in other players' untap steps too
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
