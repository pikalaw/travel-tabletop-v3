import { useState } from 'preact/hooks';
import { pool } from '../cards/pool';
import type { PlayerId } from '../engine/types';
import { other } from '../engine/types';
import type { Session } from '../host/session';
import { APP_VERSION, BUILD_ID } from '../version';
import { GameScreen } from './Game';
import { begin, clearSaved, load, save, type GameSpec } from './saved';
import { Setup } from './Setup';

type Screen =
  | { kind: 'home' }
  | { kind: 'setup' }
  | { kind: 'choose'; spec: Omit<GameSpec, 'first'>; chooser: PlayerId }
  | { kind: 'game'; spec: GameSpec; session: Session };

const cardCount = new Set(pool.packets.flatMap((p) => p.cards)).size;

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [saved, setSaved] = useState(() => load());

  const play = (spec: GameSpec, session: Session) => { save(spec, session); setScreen({ kind: 'game', spec, session }); };

  if (screen.kind === 'setup') return <Setup onBack={() => setScreen({ kind: 'home' })} onStart={(spec) => play(spec, begin(spec))} />;
  if (screen.kind === 'choose') {
    const start = (first: PlayerId) => { const spec = { ...screen.spec, first }; play(spec, begin(spec)); };
    return (
      <main class="setup flip">
        <h2>Rematch</h2>
        <p class="dim">{screen.spec.names[screen.chooser]} lost the last game and chooses:</p>
        <div class="choices">
          <button class="btn primary" onClick={() => start(screen.chooser)}>Play first</button>
          <button class="btn" onClick={() => start(other(screen.chooser))}>Draw first</button>
        </div>
      </main>
    );
  }
  if (screen.kind === 'game') {
    return (
      <GameScreen
        session={screen.session}
        onChange={(session) => { save(screen.spec, session); setScreen({ ...screen, session }); }}
        onExit={() => { setSaved(load()); setScreen({ kind: 'home' }); }}
        onRematch={(chooser) => {
          const { first: _first, seed: _seed, ...rest } = screen.spec;
          setScreen({ kind: 'choose', spec: { ...rest, seed: crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1 }, chooser });
        }}
      />
    );
  }
  const over = saved && !saved.session.game.states[saved.session.game.states.length - 1]!.decision;
  return (
    <main class="home">
      <h1>Travel Tabletop v3</h1>
      <p>A rules-enforcing Magic: The Gathering game for two players on one device, with the Avatar card pool.</p>
      <div class="home-actions">
        {saved && !over && <button class="btn primary" onClick={() => setScreen({ kind: 'game', spec: saved.spec, session: saved.session })} data-testid="resume">Resume: {saved.spec.names.p1} vs {saved.spec.names.p2}</button>}
        <button class={`btn ${saved && !over ? '' : 'primary'}`} onClick={() => { if (saved && !over) clearSaved(); setSaved(null); setScreen({ kind: 'setup' }); }} data-testid="new-game">New game</button>
      </div>
      <p class="pool">Card pool: {pool.packets.length} packets, {cardCount} cards, {pool.tokens.length} tokens.</p>
      <p class="version">v{APP_VERSION} · {BUILD_ID}</p>
    </main>
  );
}
