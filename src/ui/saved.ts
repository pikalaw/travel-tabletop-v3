/**
 * The game in progress, saved after every decision and resumed after a reload (PRD, "Replay"). A
 * game is its packets, names, first player, seed and decisions; the states are rebuilt by replaying.
 */
import { gameSetup } from '../cards/setup';
import type { PlayerId } from '../engine/types';
import { newGame, restore, type Game, type LoggedChoice } from '../host/controller';
import { startSession, type Session } from '../host/session';
import { BUILD_ID } from '../version';

export interface GameSpec {
  names: Record<PlayerId, string>;
  packets: Record<PlayerId, string[]>;
  first: PlayerId;
  seed: number;
}

interface Saved { build: string; spec: GameSpec; choices: LoggedChoice[]; ahead?: Game['ahead']; seen?: Session['seen']; facing: PlayerId; revealed: boolean }

const KEY = 'tt3.game';
const SETUP_KEY = 'tt3.setup';

const setupOf = (spec: GameSpec) => gameSetup({
  p1: { name: spec.names.p1, packets: spec.packets.p1 },
  p2: { name: spec.names.p2, packets: spec.packets.p2 },
}, spec.first);

export function begin(spec: GameSpec): Session {
  return startSession(newGame(setupOf(spec), spec.seed));
}

export function save(spec: GameSpec, x: Session): void {
  const saved: Saved = { build: BUILD_ID, spec, choices: x.game.record.choices, ...(x.game.ahead ? { ahead: x.game.ahead } : {}), ...(x.seen ? { seen: x.seen } : {}), facing: x.facing, revealed: false };
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage full or blocked: the game goes on unsaved */ }
}

/** The saved game, resumed blinded; null if there is none or it no longer replays. */
export function load(): { spec: GameSpec; session: Session } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    const game = restore({ setup: setupOf(saved.spec), seed: saved.spec.seed, choices: saved.choices });
    return { spec: saved.spec, session: { game: { ...game, ...(saved.ahead ? { ahead: saved.ahead } : {}) }, ...(saved.seen ? { seen: saved.seen } : {}), facing: saved.facing, revealed: false } };
  } catch {
    return null;
  }
}

export function clearSaved(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

/** The last names and packets picked, to pre-fill the next setup. */
export function lastSetup(): Partial<Pick<GameSpec, 'names' | 'packets'>> {
  try { return JSON.parse(localStorage.getItem(SETUP_KEY) ?? '{}') as Partial<GameSpec>; } catch { return {}; }
}

export function rememberSetup(spec: Pick<GameSpec, 'names' | 'packets'>): void {
  try { localStorage.setItem(SETUP_KEY, JSON.stringify({ names: spec.names, packets: spec.packets })); } catch { /* not remembered */ }
}
