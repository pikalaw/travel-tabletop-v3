/**
 * The engine's data (technical design, "Game state" and "The decision loop"). One immutable
 * GameState holds the whole game; decisions and choices are plain data, so a game is its setup,
 * its seed and its list of choices.
 */
import type { CardScript, Continuous, Duration, Effect, TargetSpec } from './abilities';
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
  | { kind: 'discardEffect'; player: PlayerId; count: number }
  | { kind: 'chooseColor'; player: PlayerId; object: ObjectId; options: Color[] }
  | { kind: 'arrange'; player: PlayerId; cards: ObjectId[]; to: 'bottom' | 'graveyard' }
  | { kind: 'search'; player: PlayerId; options: ObjectId[]; max: number }
  /** "You may sacrifice / discard …": pick what to pay with, or nothing to decline. */
  | { kind: 'optionalCost'; player: PlayerId; pay: 'sacrifice' | 'discard'; options: ObjectId[]; count: number }
  /** "… unless … pays": yes pays the cost; no lets `otherwise` happen. */
  | { kind: 'payOrElse'; player: PlayerId; cost: string; waterbend?: number; otherwise: string }
  /** Choose among cards shown (`from`, all visible to the chooser): between `min` and `max` of `options`. */
  | { kind: 'pick'; player: PlayerId; from: ObjectId[]; options: ObjectId[]; min: number; max: number; text: string };

export type Choice =
  | { kind: 'keep' }
  | { kind: 'mulligan' }
  | { kind: 'bottom'; cards: ObjectId[] }
  | { kind: 'pass' }
  | { kind: 'play'; object: ObjectId }
  | { kind: 'cast'; object: ObjectId; targets?: Target[][]; modes?: number[]; x?: number }
  /** `tapping`: the creatures tapped for a "tap an untapped creature you control" cost. */
  | { kind: 'activate'; object: ObjectId; ability: number; targets?: Target[][]; tapping?: ObjectId[] }
  | { kind: 'order'; triggers: number[] }
  | { kind: 'targets'; targets: Target[][] }
  | { kind: 'color'; color: Color }
  /** Scry or surveil: the cards kept on top, top first, and the ones moved away. */
  | { kind: 'arrange'; top: ObjectId[]; away: ObjectId[] }
  | { kind: 'search'; cards: ObjectId[] }
  | { kind: 'pick'; cards: ObjectId[] }
  | { kind: 'optionalCost'; objects: ObjectId[] }
  | { kind: 'yes' }
  | { kind: 'no' }
  | { kind: 'attack'; attackers: ObjectId[] }
  | { kind: 'block'; blocks: { blocker: ObjectId; attacker: ObjectId }[] }
  | { kind: 'damage'; assign: Record<ObjectId | 'player', number> }
  | { kind: 'discard'; cards: ObjectId[] }
  | { kind: 'legend'; keep: ObjectId };

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
  /** Counters on permanents that left the battlefield this turn, for "its counters" (608.2h). */
  lastKnown: Record<ObjectId, { counters: Record<string, number> }>;
  /** What happened this turn, for "this turn" conditions and "second card" triggers. */
  turnLog: { attacked: Record<PlayerId, boolean>; lifeLost: Record<PlayerId, number>; drawn: Record<PlayerId, number> };
  result: GameResult | null;
  /** Public events, oldest first. */
  events: GameEvent[];
}
