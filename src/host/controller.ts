/**
 * The game controller (technical design, "Stops are not rules" and "Undo, randomness, persistence
 * and replay"). The engine gives priority exactly as the rules say; the controller answers "pass"
 * for a player wherever the fixed response windows don't stop, logs those passes as automatic, and
 * keeps the decision log that undo, redo and replay work from.
 */
import { answer, legalActions, start } from '../engine/engine';
import type { Choice, GameSetup, GameState, ObjectId, PlayerId, Refusal } from '../engine/types';
import { other } from '../engine/types';

export interface LoggedChoice { choice: Choice; player: PlayerId; auto: boolean }

/** Everything needed to rebuild a game exactly. */
export interface GameRecord { setup: GameSetup; seed: number; choices: LoggedChoice[] }

/**
 * "Pass this combat" or "Pass until end of turn" (PRD, "Passing ahead, out loud"): public, announced
 * on the board. It ends early when the other player puts something on the stack: `stack` is what
 * was there when it was announced.
 */
export interface PassAhead { until: 'combat' | 'turn'; turn: number; stack: ObjectId[] }

export interface Game {
  record: GameRecord;
  /** Players passing ahead: their priority is passed for them until the announcement runs out. */
  ahead?: Partial<Record<PlayerId, PassAhead>>;
  /** states[i] is the state after the first i choices; the last one is the current state. */
  states: GameState[];
  /** Choices taken back by undo, newest last, for redo. */
  redo: LoggedChoice[];
}

export const current = (g: Game): GameState => g.states[g.states.length - 1]!;

/**
 * The response windows (PRD, "Players and the shared device"): fixed, public and the same for
 * both players. Whether a player stops depends only on public facts (the step, the stack, whose
 * turn it is), never on what they hold.
 */
export function stopsHere(s: GameState, p: PlayerId): boolean {
  const stack = s.zones.stack;
  if (stack.length) return s.objects[stack[stack.length - 1]!]!.controller !== p;
  const attacking = s.zones.battlefield.some((id) => s.objects[id]!.attacking !== undefined);
  switch (s.step) {
    case 'main1': case 'main2': return p === s.active;
    case 'attackers': return attacking && p === other(s.active);
    case 'blockers': return attacking;
    case 'end': return p === other(s.active);
    default: return false;
  }
}

export function newGame(setup: GameSetup, seed: number): Game {
  const g: Game = { record: { setup, seed, choices: [] }, states: [start(setup, seed)], redo: [] };
  return autoPass(g);
}

function push(g: Game, c: LoggedChoice): Game | Refusal {
  const next = answer(current(g), c.choice);
  if ('refused' in next) return next;
  return { ...g, record: { ...g.record, choices: [...g.record.choices, c] }, states: [...g.states, next] };
}

/**
 * Nothing to do (PRD, "Players and the shared device"): when Pass is the player's only legal move
 * (no land to play, nothing to cast, no ability to activate), the window is passed for them,
 * wherever it is. Unlike the fixed windows this reads the hand, so a window that doesn't open tells
 * the other player that nothing could be done there; the players chose that trade for fewer taps.
 */
function nothingToDo(s: GameState): boolean {
  return legalActions(s).every((c) => c.kind === 'pass');
}

const COMBAT_STEPS = ['beginCombat', 'attackers', 'blockers', 'firstStrikeDamage', 'damage', 'endCombat'];

/** Whether an announcement still holds: until the turn ends, or until combat this turn is over. */
export function stillPassing(s: GameState, a: PassAhead | undefined): boolean {
  if (!a || s.turn !== a.turn) return false;
  if (a.until === 'turn') return true;
  return ['upkeep', 'draw', 'main1', ...COMBAT_STEPS].includes(s.step);
}

/**
 * A player passing ahead gets their window again once the other player puts a spell, an ability
 * or a trigger on the stack: what they said before it doesn't cover it. Their own items don't count.
 */
function endIfAnswered(g: Game, p: PlayerId): Game {
  const a = g.ahead?.[p];
  if (!a) return g;
  const s = current(g);
  if (!s.zones.stack.some((id) => !a.stack.includes(id) && s.objects[id]!.controller !== p)) return g;
  const { [p]: _ended, ...rest } = g.ahead!;
  return { ...g, ahead: rest };
}

/** Passes for players wherever they have no stop or are passing ahead; `hold` keeps one player's next priority (they held it while casting). */
function autoPass(g: Game, hold?: PlayerId): Game {
  for (;;) {
    const s = current(g);
    const d = s.decision;
    if (!d || d.kind !== 'priority') return g;
    if (hold === d.player) return g;
    g = endIfAnswered(g, d.player);
    if (stopsHere(s, d.player) && !stillPassing(s, g.ahead?.[d.player]) && !nothingToDo(s)) return g;
    const next = push(g, { choice: { kind: 'pass' }, player: d.player, auto: true });
    if ('refused' in next) throw new Error(`the engine refused an automatic pass: ${next.refused}`);
    g = next;
  }
}

/** Answers the current decision for whoever it waits on, then passes automatically where nobody stops. */
export function submit(g: Game, choice: Choice, opts: { hold?: boolean } = {}): Game | Refusal {
  const d = current(g).decision;
  if (!d) return { refused: 'Nothing to decide' };
  const next = push({ ...g, redo: [] }, { choice, player: d.player, auto: false });
  return 'refused' in next ? next : autoPass(next, opts.hold ? d.player : undefined);
}

/** A player resigns (104.3a), whether or not the game is waiting for them. */
export function resign(g: Game, p: PlayerId): Game | Refusal {
  if (!current(g).decision) return { refused: 'The game is over' };
  return push({ ...g, redo: [] }, { choice: { kind: 'concede', player: p }, player: p, auto: false });
}

/** The player with priority passes, and announces passing ahead until end of combat or of the turn. */
export function passAhead(g: Game, until: PassAhead['until']): Game | Refusal {
  const s = current(g);
  const d = s.decision;
  if (d?.kind !== 'priority') return { refused: 'Only with priority' };
  return submit({ ...g, ahead: { ...g.ahead, [d.player]: { until, turn: s.turn, stack: [...s.zones.stack] } } }, { kind: 'pass' });
}

/** Index of the last choice a player made (not an automatic pass), or -1. */
function lastManual(g: Game): number {
  const cs = g.record.choices;
  for (let i = cs.length - 1; i >= 0; i--) if (!cs[i]!.auto) return i;
  return -1;
}

export const canUndo = (g: Game) => lastManual(g) >= 0;
export const canRedo = (g: Game) => g.redo.length > 0;

/** Takes back the last decision a player made, with the automatic passes after it. */
export function undo(g: Game): Game {
  const i = lastManual(g);
  if (i < 0) return g;
  return {
    record: { ...g.record, choices: g.record.choices.slice(0, i) },
    states: g.states.slice(0, i + 1),
    redo: [...g.redo, g.record.choices[i]!],
    ahead: {}, // an undo takes back announcements too
  };
}

/** Makes the last undone decision again. Randomness is in the state, so it plays out the same. */
export function redo(g: Game): Game {
  const c = g.redo[g.redo.length - 1];
  if (!c) return g;
  const next = push({ ...g, redo: g.redo.slice(0, -1) }, c);
  if ('refused' in next) throw new Error(`redo was refused: ${next.refused}`);
  return autoPass(next);
}

/** Rebuilds a game's final state from its record. */
export function replay(r: GameRecord): GameState {
  let s = start(r.setup, r.seed);
  for (const [i, c] of r.choices.entries()) {
    const next = answer(s, c.choice);
    if ('refused' in next) throw new Error(`replay: choice ${i} was refused: ${next.refused}`);
    s = next;
  }
  return s;
}

/** Rebuilds a game, every state included, from its record (to resume after a reload). */
export function restore(r: GameRecord): Game {
  let g: Game = { record: { ...r, choices: [] }, states: [start(r.setup, r.seed)], redo: [] };
  for (const [i, c] of r.choices.entries()) {
    const next = push(g, c);
    if ('refused' in next) throw new Error(`restore: choice ${i} was refused: ${next.refused}`);
    g = next;
  }
  return g;
}
