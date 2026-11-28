/**
 * The engine's data (technical design, "Game state" and "The decision loop"). One immutable
 * GameState holds the whole game; decisions and choices are plain data, so a game is its setup,
 * its seed and its list of choices.
 */
import type { CardScript, Continuous, Duration, Effect, TargetSpec, TriggeredAbility } from './abilities';
import type { RngState } from './rng';

export type PlayerId = 'p1' | 'p2';
export const PLAYERS: readonly PlayerId[] = ['p1', 'p2'];
export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** A physical card for the whole game. */
export type CardId = string;
/** One object: a new one each time a card changes zones (CR 400.7). */
export type ObjectId = string;

export type Color = 'W' | 'U' | 'B' | 'R' | 'G';
export const COLORS: readonly Color[] = ['W', 'U', 'B', 'R', 'G'];

/** One mana symbol of a cost. */
export type ManaSymbol =
  | { kind: 'generic'; amount: number }
  | { kind: 'color'; color: Color }
  | { kind: 'hybrid'; colors: [Color, Color] }
  | { kind: 'colorless' }
  | { kind: 'x' };

/** A card's printed characteristics, read from the card data at setup. */
export interface Printed {
  name: string;
  oracleId: string;
  manaCost: ManaSymbol[];
  supertypes: string[];
  types: string[];
  subtypes: string[];
  power?: number;
  toughness?: number;
  keywords: string[];
  /** Its colours; absent means derived from the mana cost (202.2). */
  colors?: Color[];
  text: string;
  /** What the card does beyond its printed values; absent for vanilla cards and basic lands. */
  script?: CardScript;
  token?: boolean;
}

export type Step =
  | 'untap' | 'upkeep' | 'draw' | 'main1'
  | 'beginCombat' | 'attackers' | 'blockers' | 'firstStrikeDamage' | 'damage' | 'endCombat'
  | 'main2' | 'end' | 'cleanup';

export const STEPS: readonly Step[] = [
  'untap', 'upkeep', 'draw', 'main1', 'beginCombat', 'attackers', 'blockers', 'firstStrikeDamage',
  'damage', 'endCombat', 'main2', 'end', 'cleanup',
];

export type ZoneKind = 'library' | 'hand' | 'graveyard' | 'exile' | 'battlefield' | 'stack';
/** Per-player zones are "p1.hand"; the shared ones are "battlefield" and "stack". */
export type ZoneId = `${PlayerId}.${'library' | 'hand' | 'graveyard' | 'exile'}` | 'battlefield' | 'stack';

export interface GameObject {
  id: ObjectId;
  card: CardId;
  owner: PlayerId;
  controller: PlayerId;
  zone: ZoneId;
  /** When it entered its zone: orders effects within a layer, and summoning sickness. */
  timestamp: number;
  tapped: boolean;
  /** The turn it came under its controller's control; it is summoning-sick on that turn. */
  controlledSince: number;
  damage: number;
  /** Damage marked by a source with deathtouch since the last state-based check. */
  deathtouched: boolean;
  counters: Record<string, number>;
  /** In combat: the player it attacks, or the attackers it blocks. */
  attacking?: PlayerId;
  blocking?: ObjectId[];
  blockedBy?: ObjectId[];
  /** Whether it was blocked this combat, even if its blockers have left. */
  blocked?: boolean;
  /** Combat damage it dealt in the first-strike step, so it skips the regular step unless it has double strike. */
  dealtFirstStrike?: boolean;
  /** For a spell or ability on the stack: its chosen targets, one list per target spec. */
  targets?: Target[][];
  /** For an ability on the stack: which ability of which source, and what triggered it. */
  ability?: StackAbility;
  /** An Aura or Equipment: what it is attached to. */
  attachedTo?: ObjectId;
  /** Exiled by airbending: its owner may cast it from exile for {2}. */
  airbended?: boolean;
  /** "You may play that card this turn": the turn it may be played from exile by its owner. */
  playableTurn?: number;
  /** The colour chosen as it entered (Thriving lands). */
  chosenColor?: Color;
  /** Exiled by this object's ability, for "the card exiled with Nyla". */
  exiledWith?: ObjectId;
  /** For a spell on the stack: what its additional cost sacrificed. */
  sacrificedForCost?: ObjectId[];
  /** A token that's a copy of a card (Joo Dee): it ceases to exist when it leaves the battlefield. */
  tokenCopy?: boolean;
  /** A copy that isn't legendary (Ran and Shaw's token). */
  notLegendary?: boolean;
  /** A copy of a spell on the stack (Jeong Jeong): it ceases to exist as it leaves the stack (707.10). */
  spellCopy?: boolean;
  /** Exiled instead of going anywhere else as it leaves the stack: cast with flashback (702.34), or by Storm of Memories. */
  exileFromStack?: boolean;
  /** "Gains flashback until end of turn" (Lost in Memories): the turn it has it, its flashback cost its mana cost. */
  flashbackThisTurn?: number;
  /** This spell was the n-th cast this turn, counting every player's (storm, 702.40). */
  castNumber?: number;
  /** This permanent was cast ("if you cast them"), not put onto the battlefield otherwise. */
  wasCast?: boolean;
  /**
   * Another player may cast this exiled card (Hama, Fire Lord Ozai): who, how it's paid, and how
   * long: while they control `source`, or through `untilTurn`. `group`: only one of the group may be played.
   */
  castableBy?: { player: PlayerId; cost: 'free' | 'waterbendManaValue'; source?: ObjectId; untilTurn?: number; yourTurnOnly?: boolean; group?: string };
  /** The additional-cost option it was cast with, kept by the permanent it becomes ("if her additional cost was paid"). */
  castWith?: number;
  /** For a spell on the stack: counters the permanent enters with (mana with a rider was spent on it). */
  entersWithCounters?: Record<string, number>;
  /** For a spell on the stack: the modes chosen and the value of X. */
  modes?: number[];
  x?: number;
}

/** A chosen target: an object or a player. */
export type Target = ObjectId | PlayerId;

export interface StackAbility {
  /** The source object, which may have left its zone since. */
  source: ObjectId;
  sourceName: string;
  kind: 'activated' | 'triggered';
  /** Index into the source card's script. */
  index: number;
  /** The object the trigger's event was about, if any. */
  eventObject?: ObjectId;
  /** How much of something the event was about ("that much": the counters put). */
  eventAmount?: number;
  /** The spell or ability the event came from (a target chosen by it). */
  eventSource?: ObjectId;
  /** What the source was attached to as the ability was activated (a sacrificed Aura's "enchanted creature"). */
  attachedTo?: ObjectId;
}

/** A continuous effect from a resolved spell or ability (611.2): its affected set is fixed when it begins. */
export interface EffectInstance {
  effect: Continuous;
  /** The objects it affects, fixed at resolution (611.2c). */
  affected: ObjectId[];
  timestamp: number;
  duration: Duration;
  controller: PlayerId;
  source: ObjectId;
  /** The source's name as the effect began, for the breakdown of the numbers it changes. */
  sourceName?: string;
}

/** A triggered ability waiting to be put on the stack the next time a player would receive priority (603.3). */
export interface PendingTrigger {
  controller: PlayerId;
  source: ObjectId;
  sourceName: string;
  card: CardId;
  index: number;
  eventObject?: ObjectId;
  eventAmount?: number;
  eventSource?: ObjectId;
  /** Its controller has put it in order among their other triggers. */
  ordered?: boolean;
}

/** A spell or ability partway through resolving, waiting on a choice (608.2). */
export interface Resolving {
  object: ObjectId;
  /** The effect list being run and where it is. */
  effects: Effect[];
  pc: number;
  controller: PlayerId;
  source: ObjectId;
  targets: Target[][];
  specs: TargetSpec[];
  eventObject?: ObjectId;
  x?: number;
  /** The token created last while resolving, for "it". */
  created?: ObjectId;
  attachedTo?: ObjectId;
  eventAmount?: number;
  eventSource?: ObjectId;
  /** What the last "choose" picked, and the cards discarded, for later effects ("it", "this way"). */
  chosen?: ObjectId[];
  discarded?: ObjectId[];
  /** The excess damage this resolution's last damage dealt ("the amount of excess damage dealt this way"). */
  excess?: number;
  /** Destined Confrontation: the creatures each player keeps, as they choose. */
  kept?: Partial<Record<PlayerId, ObjectId[]>>;
  /** A free cast it offered was answered (cast or declined). */
  castFreeAnswered?: boolean;
  /** Cards an effect looked at, kept across its decision. */
  looked?: ObjectId[];
}

export interface PlayerState {
  life: number;
  /** Floating mana by colour; C is colourless. */
  pool: Record<Color | 'C', number>;
  /** Mana that lasts until end of combat (firebending), not emptied as steps end. */
  combatPool: Record<Color | 'C', number>;
  landsPlayed: number;
  /** Additional land drops this turn (Explore). */
  extraLands: number;
  /** Set by drawing from an empty library; checked as a state-based action. */
  drewFromEmpty: boolean;
  mulligans: number;
  kept: boolean;
  /** Counters on the player (experience). */
  counters: Record<string, number>;
}

export type Decision =
  | { kind: 'mulligan'; player: PlayerId }
  | { kind: 'bottom'; player: PlayerId; count: number }
  | { kind: 'priority'; player: PlayerId }
  | { kind: 'attackers'; player: PlayerId }
  | { kind: 'blockers'; player: PlayerId }
  | { kind: 'damage'; player: PlayerId; attacker: ObjectId; blockers: ObjectId[]; power: number; trample: boolean }
  | { kind: 'discard'; player: PlayerId; count: number }
  | { kind: 'legend'; player: PlayerId; name: string; objects: ObjectId[] }
  | { kind: 'triggerOrder'; player: PlayerId; triggers: number[] }
  | { kind: 'triggerTargets'; player: PlayerId; trigger: number }
  | { kind: 'may'; player: PlayerId; text: string }
  | { kind: 'chooseColor'; player: PlayerId; object: ObjectId; options: Color[] }
  | { kind: 'arrange'; player: PlayerId; cards: ObjectId[]; to: 'bottom' | 'graveyard' }
  /** "… unless … pays": yes pays the cost; no lets `otherwise` happen. With `reward`, "You may pay {1}. If you do, …": yes pays for it. */
  | { kind: 'payOrElse'; player: PlayerId; cost: string; waterbend?: number; otherwise?: string; reward?: string }
  /**
   * The general card choice that effects ask: between `min` and `max` of `options`, among the cards
   * shown (`from`, all visible to the chooser), or (`orNone`) none at all. `done` and `none` label
   * the answer with and without cards ("Sacrifice", "Don't"). Discards, searches, optional costs
   * and looks at the library all ask this, so a mechanic that chooses cards needs no new prompt.
   */
  | { kind: 'pick'; player: PlayerId; from: ObjectId[]; options: ObjectId[]; min: number; max: number; orNone?: boolean; text: string; done?: string; none?: string; maxPower?: number }
  /** The general choice among worded options ("Put it onto the battlefield", "Leave it on top"), with any cards it's about, shown to the chooser. */
  /** With `max`: pick up to that many options (modes); options sharing an `exclusive` key exclude each other. */
  | { kind: 'choose'; player: PlayerId; text: string; options: string[]; cards?: ObjectId[]; max?: number; exclusive?: (string | null)[] }
  /** Divide `total` (counters, damage) among `options`, each getting any number, all of it given out. */
  | { kind: 'distribute'; player: PlayerId; options: ObjectId[]; total: number; text: string }
  /** "You may cast a … spell from your hand without paying its mana cost": a cast of one of `options`, or no. */
  | { kind: 'castFree'; player: PlayerId; options: ObjectId[]; exileAfter?: boolean };

export type Choice =
  | { kind: 'keep' }
  /** A player concedes (104.3a): at any time, whoever the engine is waiting for. */
  | { kind: 'concede'; player: PlayerId }
  | { kind: 'mulligan' }
  | { kind: 'bottom'; cards: ObjectId[] }
  | { kind: 'pass' }
  | { kind: 'play'; object: ObjectId }
  /** `cost`: which of the spell's additional-cost options; `sacrificing`, `discarding`: what a cost that takes objects takes. */
  | { kind: 'cast'; object: ObjectId; targets?: Target[][]; modes?: number[]; x?: number; cost?: number; sacrificing?: ObjectId[]; discarding?: ObjectId[] }
  /** `tapping`: the creatures tapped for a "tap an untapped creature you control" cost. */
  | { kind: 'activate'; object: ObjectId; ability: number; targets?: Target[][]; tapping?: ObjectId[]; sacrificing?: ObjectId[]; discarding?: ObjectId[] }
  | { kind: 'order'; triggers: number[] }
  | { kind: 'targets'; targets: Target[][] }
  | { kind: 'color'; color: Color }
  /** Scry or surveil: the cards kept on top, top first, and the ones moved away. */
  | { kind: 'arrange'; top: ObjectId[]; away: ObjectId[] }
  | { kind: 'pick'; cards: ObjectId[] }
  | { kind: 'option'; index: number }
  /** For a choose with `max`: the options taken (any number up to it). */
  | { kind: 'options'; indices: number[] }
  | { kind: 'distribute'; amounts: Record<ObjectId, number> }
  | { kind: 'yes' }
  | { kind: 'no' }
  | { kind: 'attack'; attackers: ObjectId[] }
  | { kind: 'block'; blocks: { blocker: ObjectId; attacker: ObjectId }[] }
  | { kind: 'damage'; assign: Record<ObjectId | 'player', number> }
  | { kind: 'discard'; cards: ObjectId[] }
  | { kind: 'legend'; keep: ObjectId };

/** A delayed or reflexive triggered ability: what it does, whose it is, and what it watches. */
export interface DelayedTrigger {
  ability: TriggeredAbility;
  controller: PlayerId;
  source: ObjectId;
  sourceName: string;
  card: CardId;
  /** The one object its event must be about ("when that creature dies"). */
  about?: ObjectId;
  /** The last turn it can trigger ("this turn"). */
  untilTurn?: number;
  /** It triggered (once only), or it was reflexive and put straight into pending triggers. */
  done?: boolean;
  /** "Whenever …": it triggers every time, until `untilTurn` ends. */
  repeats?: boolean;
}

export interface Refusal { refused: string }

export type GameResult = { winner: PlayerId | null; reason: string };

/** One line of the game's public story: what happened, in words both players may read. */
export interface GameEvent { turn: number; text: string }

export interface GameSetup {
  players: Record<PlayerId, { name: string; deck: CardId[] }>;
  /** Printed characteristics of every card in either deck. */
  cards: Record<CardId, Printed>;
  /** Who plays first; the coin flip and the play-or-draw choice happen before setup. */
  first: PlayerId;
}

export interface GameState {
  /** Bumps on every step of the engine; the cache key for derived values. */
  seq: number;
  setup: GameSetup;
  turn: number;
  active: PlayerId;
  step: Step;
  /** Who has priority, when someone does. */
  priority: PlayerId | null;
  /** Consecutive passes with the stack unchanged. */
  passes: number;
  players: Record<PlayerId, PlayerState>;
  objects: Record<ObjectId, GameObject>;
  zones: Record<ZoneId, ObjectId[]>;
  nextId: number;
  nextTimestamp: number;
  rng: RngState;
  decision: Decision | null;
  /** Combat damage already divided this step, by attacker, while other splits are still asked. */
  assignments: Record<ObjectId, Record<ObjectId | 'player', number>>;
  /** The current step's turn-based action hasn't finished (it may be waiting on a decision). */
  pendingTurnBased: boolean;
  effects: EffectInstance[];
  pendingTriggers: PendingTrigger[];
  resolving: Resolving | null;
  /** Activations this turn, by "objectId:index", for "activate only once each turn". */
  activatedThisTurn: Record<string, number>;
  /** Exhaust abilities used, by "objectId:index" (702.177: each only once). */
  exhausted: Record<string, true>;
  /**
   * Delayed and reflexive triggered abilities (603.7, 603.12), created by effects; a pending trigger
   * names one as index DELAYED + its position here. Entries stay (marked done) so indices hold.
   */
  delayed: DelayedTrigger[];
  /** Counters on permanents that left the battlefield this turn, for "its counters" (608.2h). */
  lastKnown: Record<ObjectId, { counters: Record<string, number>; movedTo?: ObjectId; power?: number; controller?: PlayerId }>;
  /** What happened this turn, for "this turn" conditions and "second card" triggers. */
  turnLog: {
    attacked: Record<PlayerId, boolean>; lifeLost: Record<PlayerId, number>; drawn: Record<PlayerId, number>; tapped: Record<ObjectId, number>;
    /** Lands that entered under each player's control, and creature spells each player cast. */
    landsEntered: Record<PlayerId, number>; creatureSpells: Record<PlayerId, number>;
    /** Spells cast this turn, by any player (storm). */
    spells: number;
    /** Cards each player discarded, permanents each sacrificed, and creatures that left the battlefield under each one's control. */
    discarded: Record<PlayerId, number>; sacrificed: Record<PlayerId, number>; creaturesLeft: Record<PlayerId, number>;
    /** Creatures that attacked this turn. */
    attackers: ObjectId[];
  };
  result: GameResult | null;
  /** Public events, oldest first. */
  events: GameEvent[];
}
