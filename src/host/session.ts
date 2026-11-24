/**
 * Who holds the device (technical design, "Hidden information and hand-offs"). The engine knows
 * who must act; the session knows who the board faces and whether their hand may show. When the
 * two differ, the UI shows the public view and the hand-off bar, and nothing hidden renders until
 * the right player taps Look.
 *
 * The board faces the player whose turn it is and flips at each turn change, blinded. A player who
 * taps Look to act gets the board for as long as they act; then it flips back to the active player,
 * blinded again, since the other player may still be holding the phone. A one-tap Pass from the
 * hand-off bar changes nothing.
 */
import type { Choice, PlayerId, Refusal } from '../engine/types';
import { current, redo, submit, undo, type Game } from './controller';

export interface Session {
  game: Game;
  /** The player the board faces: the bottom half is theirs. */
  facing: PlayerId;
  /** Whether the facing player has unblinded (tapped Look) since the device last changed hands. */
  revealed: boolean;
}

export const acting = (x: Session): PlayerId | null => current(x.game).decision?.player ?? null;

/** True when the player who must act isn't the one holding an unblinded device. */
export const handingOff = (x: Session): boolean => {
  const p = acting(x);
  return p !== null && (p !== x.facing || !x.revealed);
};

/** Whose hand may be drawn face up right now: only the facing player's, and only when they act or nobody does. */
export const visibleHand = (x: Session): PlayerId | null => (x.revealed && !handingOff(x) ? x.facing : null);

export function startSession(game: Game): Session {
  return settle({ game, facing: current(game).active, revealed: false }, -1, null);
}

/** The acting player takes the device and unblinds. */
export function look(x: Session): Session {
  const p = acting(x);
  return p ? { ...x, facing: p, revealed: true } : x;
}

/**
 * Answers the decision. From the hand-off bar (`fromBar`), only a pass, and nothing flips; else the
 * facing player answers their own decision.
 */
export function choose(x: Session, choice: Choice, fromBar = false): Session | Refusal {
  const p = acting(x);
  if (!p) return { refused: 'Nothing to decide' };
  if (fromBar && choice.kind !== 'pass') return { refused: 'Only a pass can be made without looking' };
  if (!fromBar && handingOff(x)) return { refused: 'Tap Look first' };
  const before = current(x.game).turn;
  const g = submit(x.game, choice);
  if ('refused' in g) return g;
  return settle({ ...x, game: g }, before, fromBar ? null : p);
}

/** After a change: a new turn faces the active player, blinded; a visitor who finished acting hands back. */
function settle(x: Session, turnBefore: number, by: PlayerId | null): Session {
  const s = current(x.game);
  if (s.turn !== turnBefore && turnBefore >= 0 && s.turn > 0) return { ...x, facing: s.active, revealed: false };
  if (by && by !== s.active && acting(x) !== by && s.turn > 0) return { ...x, facing: s.active, revealed: false };
  return x;
}

export function undoLast(x: Session): Session {
  return settle({ ...x, game: undo(x.game) }, -1, null);
}

export function redoLast(x: Session): Session {
  const before = current(x.game).turn;
  return settle({ ...x, game: redo(x.game) }, before, null);
}
