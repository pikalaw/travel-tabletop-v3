/**
 * The log (v2's log): every public event, numbered by turn, newest last and in view. Lines since
 * the player last acted are marked, which is what "while you were away" used to show.
 */
import { useEffect, useRef } from 'preact/hooks';
import type { GameState, PlayerId } from '../engine/types';
import { other } from '../engine/types';
import { playerName } from './model';

/** Whose turn a turn number is (turns alternate from the first player); none for the mulligans. */
export const turnPlayer = (s: GameState, turn: number): PlayerId | null => (turn < 1 ? null : turn % 2 === 1 ? s.setup.first : other(s.setup.first));

export function LogPanel({ s, since, onClose }: { s: GameState; since: number | null; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { if (panel.current) panel.current.scrollTop = panel.current.scrollHeight; }, [s.events.length]);
  const events = s.events.slice(-400);
  const offset = s.events.length - events.length;
  return (
    <div class="log-panel" data-testid="log" ref={panel}>
      <button class="log-close" onClick={onClose} aria-label="Close the log" data-testid="close-log">✕</button>
      <ol class="log">
        {events.map((e, i) => {
          // A banner in the turn player's colour opens each turn, as in v2.
          const head = i === 0 || events[i - 1]!.turn !== e.turn;
          const who = turnPlayer(s, e.turn);
          return [
            head && <li key={`t${e.turn}`} class={`turn-head ${who ?? ''}`}>{who ? `Turn ${e.turn} · ${playerName(s, who)}` : 'Mulligans'}</li>,
            <li key={offset + i} class={since !== null && offset + i >= since ? 'since-look' : ''}>{e.text}</li>,
          ];
        })}
      </ol>
    </div>
  );
}
