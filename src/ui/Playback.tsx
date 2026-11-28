/**
 * Playback (PRD, "Playing"): after a move, each spell or ability that resolved and each round of
 * combat damage is shown in turn, with what it changed pulsing. It starts paused on its first step:
 * › steps, » runs the rest by itself, ✕ or the player's next move ends it.
 */
import type { GameState, ObjectId } from '../engine/types';
import { playerName, type Beat } from './model';

/** How long each step shows when playback runs by itself (»). */
export const BEAT_MS = 1500;

export interface Controls { next: () => void; auto: () => void; end: () => void; running: boolean; last: boolean; view: (id: ObjectId, at: number) => void }

export function BeatBanner({ s, beat, n, of, c }: { s: GameState; beat: Beat; n: number; of: number; c: Controls }) {
  return (
    <div class={`beat ${beat.controller ?? ''}`} data-testid="beat">
      <span class="beat-controls">
        {!c.last && <button class="btn" onClick={c.next} aria-label="Next step" data-tip="Show the next step." data-testid="beat-next">›</button>}
        {!c.last && !c.running && <button class="btn" onClick={c.auto} aria-label="Play the rest" data-tip="Play the rest, a step every second and a half." data-testid="beat-auto">»</button>}
        <button class="btn" onClick={c.end} aria-label="Done" data-tip="Stop the playback and show the board as it is now. Your next move stops it too." data-testid="beat-end">✕</button>
      </span>
      {beat.image ? <img src={beat.image} alt="" data-card={beat.object} data-card-at={beat.at - 1} onClick={() => beat.object && c.view(beat.object, beat.at - 1)} data-testid="beat-card" /> : <span class="beat-icon">⚔</span>}
      <span class="beat-text">
        <b class={beat.controller ? `by ${beat.controller}` : ''}>{beat.title}</b>
        {beat.controller && <span class="dim"> · {playerName(s, beat.controller)}</span>}
        {of > 1 && <span class="dim"> · {n}/{of}</span>}
        {beat.text && <span class="beat-ability">{beat.text}</span>}
        {beat.lines.map((t, i) => <span key={i} class="beat-line">{t}</span>)}
      </span>
    </div>
  );
}
