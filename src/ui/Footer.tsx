/**
 * The footer: the hand-off bar while the device changes hands, the acting player's own footer, or
 * the game's end. Every one has the menu (☰).
 */
import type { Choice, GameState, PlayerId } from '../engine/types';
import { other } from '../engine/types';
import type { LoggedChoice } from '../host/controller';
import { passMeaning, playerName } from './model';
import { asking } from './Prompts';

/** The undo icon: an arrow curving back. */
const UndoIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);

/** Words for a decision Undo would take back: "Undo Claire's block". */
const UNDO_WORDS: Partial<Record<Choice['kind'], string>> = { cast: 'cast', play: 'land', activate: 'ability', attack: 'attack', block: 'block', pass: 'pass', keep: 'keep', mulligan: 'mulligan', targets: 'targets', order: 'order', discard: 'discard' };

export interface FooterProps {
  s: GameState;
  /** Whose decision the device is being handed to, during a hand-off. */
  handoffTo: PlayerId | null;
  /** A cast or activation is in progress: its prompt has the buttons. */
  casting: boolean;
  canUndo: boolean;
  /** The last decision a player made, which Undo takes back. */
  lastManual: LoggedChoice | undefined;
  onMenu: () => void;
  onUndo: () => void;
  onPassAhead: () => void;
  onPass: (fromBar: boolean) => void;
  onLook: () => void;
  onRematch: (chooser: PlayerId) => void;
  onExit: () => void;
}

export function Footer(f: FooterProps) {
  const { s } = f;
  const d = s.decision;
  const menu = <button class="btn" onClick={f.onMenu} aria-label="Menu" data-tip="The log, redo, hide your hand, resign, or leave the game." data-testid="menu">☰</button>;
  if (!d) {
    const r = s.result;
    return (
      <div class="foot">
        <span class="say"><b>{r?.winner ? `${playerName(s, r.winner)} wins` : 'A draw'}</b> · {r?.reason}</span>
        {menu}
        <button class="btn" onClick={() => f.onRematch(r?.winner ? other(r.winner) : 'p1')} data-tip="Play again with the same decks; the loser chooses to play or draw." data-testid="rematch">Rematch</button>
        <button class="btn primary" onClick={f.onExit} data-testid="home">Home</button>
      </div>
    );
  }
  // Undo that would take back the other player's decision says so, in their colour ("Claire's block").
  const undoOther = f.lastManual && f.lastManual.player !== d.player ? f.lastManual : null;
  const undoWords = undoOther ? `Undo ${playerName(s, undoOther.player)}'s ${UNDO_WORDS[undoOther.choice.kind] ?? 'move'}` : 'Undo';
  const undoLabel = <><UndoIcon />{undoOther && <span class="undo-who">{undoWords.replace(/^Undo /, '')}</span>}</>;
  const undoClass = `btn ${undoOther ? `undo-other ${undoOther.player}` : ''}`;
  const priority = d.kind === 'priority';
  const aheadTip = 'Pass this combat, or until end of turn, out loud: both players see it. It ends if the other player plays something.';
  if (f.handoffTo) {
    return (
      <div class={`foot handoff ${f.handoffTo}`} data-testid="handoff">
        <span class="say"><b class={`who ${f.handoffTo}`}>{playerName(s, f.handoffTo)} to act</b>: {asking(s)}</span>
        {menu}
        {f.canUndo && <button class={undoClass} onClick={f.onUndo} aria-label={undoWords} data-tip="Take back the last decision. Taking back the other player's asks first." data-testid="bar-undo">{undoLabel}</button>}
        {priority && <button class="btn" onClick={f.onPassAhead} data-tip={aheadTip} data-testid="bar-pass-ahead">»</button>}
        {priority && <button class="btn" onClick={() => f.onPass(true)} data-tip="Pass without showing your hand. Nothing flips." aria-label="Pass" data-testid="bar-pass">›</button>}
        <button class="btn primary" onClick={f.onLook} data-tip="Take the phone and show your hand, to act." data-testid="look">Look</button>
      </div>
    );
  }
  const passing = priority && !f.casting;
  return (
    <div class={`foot ${d.player}`}>
      <span class="say">{passing ? <>Pass: <b>{passMeaning(s)}</b></> : <b>{playerName(s, d.player)}</b>}</span>
      {menu}
      <button class={undoClass} disabled={!f.canUndo} onClick={f.onUndo} aria-label={undoWords} data-tip="Take back the last decision, with the automatic passes after it." data-testid="undo">{undoLabel}</button>
      {passing && <button class="btn" onClick={f.onPassAhead} data-tip={aheadTip} data-testid="pass-ahead">»</button>}
      {passing && <button class="btn primary" onClick={() => f.onPass(false)} data-tip={`Pass priority: ${passMeaning(s)}.`} aria-label="Pass" data-testid="pass">›</button>}
    </div>
  );
}
