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
import type { Choice, ObjectId, PlayerId, Refusal } from '../engine/types';
import { current, passAhead, redo, resign, submit, undo, type Game, type PassAhead } from './controller';

export interface Session {
  game: Game;
  /** The player the board faces: the bottom half is theirs. */
  facing: PlayerId;
  /** Whether the facing player has unblinded (tapped Look) since the device last changed hands. */
  revealed: boolean;
  /** Each player's hand as it was when the device last left them: cards not in it are new to them. */
  seen?: Partial<Record<PlayerId, ObjectId[]>>;
}

/**
 * Cards new in a player's hand: arrived since the device last left them (a draw, a bounce, a
 * search). The mark lasts while they hold the device and clears once it has gone to the other
 * player and come back; a one-tap Pass from the hand-off bar doesn't count. None during mulligans.
 */
export function newInHand(x: Session, p: PlayerId): Set<ObjectId> {
  const s = current(x.game);
  const seen = x.seen?.[p];
  if (s.turn === 0 || !seen) return new Set();
  return new Set(s.zones[`${p}.hand`].filter((id) => !seen.includes(id)));
}

/** When the device leaves an unblinded player (they hand it over, or it flips blinded), what they had seen is remembered. */
function remember(before: Session, after: Session): Session {
  const p = before.facing;
  if (!before.revealed || (after.facing === p && after.revealed)) return after;
  return { ...after, seen: { ...after.seen, [p]: [...current(before.game).zones[`${p}.hand`]] } };
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
  return p ? remember(x, { ...x, facing: p, revealed: true }) : x;
}

/**
 * Answers the decision. From the hand-off bar (`fromBar`), only a pass, and nothing flips; else the
 * facing player answers their own decision.
 */
export function choose(x: Session, choice: Choice, opts: { fromBar?: boolean; hold?: boolean; ahead?: PassAhead['until'] } = {}): Session | Refusal {
  const p = acting(x);
  const fromBar = !!opts.fromBar;
  if (!p) return { refused: 'Nothing to decide' };
  if (fromBar && choice.kind !== 'pass') return { refused: 'Only a pass can be made without looking' };
  if (!fromBar && handingOff(x)) return { refused: 'Tap Look first' };
  const before = current(x.game).turn;
  const g = opts.ahead && choice.kind === 'pass' ? passAhead(x.game, opts.ahead) : submit(x.game, choice, { hold: !!opts.hold });
  if ('refused' in g) return g;
  return remember(x, settle({ ...x, game: g }, before, fromBar ? null : p));
}

/** The player holding the device resigns. */
export function resignGame(x: Session, p: PlayerId): Session | Refusal {
  const g = resign(x.game, p);
  return 'refused' in g ? g : { ...x, game: g };
}

/** After a change: a new turn faces the active player, blinded; a visitor who finished acting hands back. */
function settle(x: Session, turnBefore: number, by: PlayerId | null): Session {
  const s = current(x.game);
  if (s.turn !== turnBefore && turnBefore >= 0 && s.turn > 0) return { ...x, facing: s.active, revealed: false };
  if (by && by !== s.active && acting(x) !== by && s.turn > 0) return { ...x, facing: s.active, revealed: false };
  return x;
}

export function undoLast(x: Session): Session {
  return remember(x, settle({ ...x, game: undo(x.game) }, -1, null));
}

export function redoLast(x: Session): Session {
  const before = current(x.game).turn;
  return remember(x, settle({ ...x, game: redo(x.game) }, before, null));
}
