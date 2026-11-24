/**
 * The game controller (technical design, "Stops are not rules" and "Undo, randomness, persistence
 * and replay"). The engine gives priority exactly as the rules say; the controller answers "pass"
 * for a player wherever the fixed response windows don't stop, logs those passes as automatic, and
 * keeps the decision log that undo, redo and replay work from.
 */
import { answer, start } from '../engine/engine';
import type { Choice, GameSetup, GameState, PlayerId, Refusal } from '../engine/types';
import { other } from '../engine/types';

export interface LoggedChoice { choice: Choice; player: PlayerId; auto: boolean }

/** Everything needed to rebuild a game exactly. */
export interface GameRecord { setup: GameSetup; seed: number; choices: LoggedChoice[] }

export interface Game {
  record: GameRecord;
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
  return { record: { ...g.record, choices: [...g.record.choices, c] }, states: [...g.states, next], redo: g.redo };
}

function autoPass(g: Game): Game {
  for (;;) {
    const s = current(g);
    const d = s.decision;
    if (!d || d.kind !== 'priority' || stopsHere(s, d.player)) return g;
    const next = push(g, { choice: { kind: 'pass' }, player: d.player, auto: true });
    if ('refused' in next) throw new Error(`the engine refused an automatic pass: ${next.refused}`);
    g = next;
  }
}

/** Answers the current decision for whoever it waits on, then passes automatically where nobody stops. */
export function submit(g: Game, choice: Choice): Game | Refusal {
  const d = current(g).decision;
  if (!d) return { refused: 'Nothing to decide' };
  const next = push({ ...g, redo: [] }, { choice, player: d.player, auto: false });
  return 'refused' in next ? next : autoPass(next);
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
