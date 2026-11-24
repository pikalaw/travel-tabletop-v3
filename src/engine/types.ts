/**
 * The engine's data (technical design, "Game state" and "The decision loop"). One immutable
 * GameState holds the whole game; decisions and choices are plain data, so a game is its setup,
 * its seed and its list of choices.
 */
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
  text: string;
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
}

export interface PlayerState {
  life: number;
  /** Floating mana by colour; C is colourless. */
  pool: Record<Color | 'C', number>;
  landsPlayed: number;
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
  | { kind: 'legend'; player: PlayerId; name: string; objects: ObjectId[] };

export type Choice =
  | { kind: 'keep' }
  | { kind: 'mulligan' }
  | { kind: 'bottom'; cards: ObjectId[] }
  | { kind: 'pass' }
  | { kind: 'play'; object: ObjectId }
  | { kind: 'cast'; object: ObjectId }
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
  result: GameResult | null;
  /** Public events, oldest first. */
  events: GameEvent[];
}
