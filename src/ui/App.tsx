import { useEffect, useState } from 'preact/hooks';
import { pool } from '../cards/pool';
import type { PlayerId } from '../engine/types';
import { other } from '../engine/types';
import type { Session } from '../host/session';
import { APP_VERSION, BUILD_ID } from '../version';
import { colorsOf, colorVars } from './colors';
import { GameScreen } from './Game';
import { begin, clearSaved, gameInUrl, load, newGameId, save, setGameInUrl, type GameSpec } from './saved';
import { Setup } from './Setup';

type Screen =
  | { kind: 'home' }
  | { kind: 'setup' }
  | { kind: 'choose'; spec: Omit<GameSpec, 'first'>; chooser: PlayerId }
  | { kind: 'game'; spec: GameSpec; session: Session };

const cardCount = new Set(pool.packets.flatMap((p) => p.cards)).size;

/** The screen an address opens: the saved game its #game=<id> names, else home (with a note if that game isn't here). */
function fromUrl(saved: ReturnType<typeof load>): { screen: Screen; missing: boolean } {
  const id = gameInUrl();
  if (!id) return { screen: { kind: 'home' }, missing: false };
  if (saved && saved.spec.id === id) return { screen: { kind: 'game', spec: saved.spec, session: saved.session }, missing: false };
  return { screen: { kind: 'home' }, missing: true };
}

export function App({ update, offlineReady }: { update: (() => void) | null; offlineReady: boolean }) {
  const [saved, setSaved] = useState(() => load());
  const [start] = useState(() => fromUrl(saved));
  const [screen, setScreen] = useState<Screen>(start.screen);
  const [missing, setMissing] = useState(start.missing);

  // The address names the game on screen, so a reload (or an accidental refresh) comes back to it,
  // blinded; Back goes home, and Forward returns to the game.
  useEffect(() => { if (screen.kind === 'game') setGameInUrl(screen.spec.id); }, [screen.kind === 'game' ? screen.spec.id : null]);
  useEffect(() => {
    const pop = () => {
      const now = load();
      setSaved(now);
      const next = fromUrl(now);
      setMissing(next.missing);
      setScreen(next.screen);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  const play = (spec: GameSpec, session: Session) => { save(spec, session); setScreen({ kind: 'game', spec, session }); };

  if (screen.kind === 'setup') return <Setup onBack={() => setScreen({ kind: 'home' })} onStart={(spec) => play(spec, begin(spec))} />;
  if (screen.kind === 'choose') {
    const start = (first: PlayerId) => { const spec = { ...screen.spec, first }; play(spec, begin(spec)); };
    return (
      <main class="setup flip" style={colorVars(colorsOf(screen.spec.colors))}>
        <h2>Rematch</h2>
        <p class="dim"><span class={`who ${screen.chooser}`}>{screen.spec.names[screen.chooser]}</span> lost the last game and chooses:</p>
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
        colors={colorsOf(screen.spec.colors)}
        onChange={(session) => { save(screen.spec, session); setScreen({ ...screen, session }); }}
        onExit={() => { setGameInUrl(null); setSaved(load()); setScreen({ kind: 'home' }); }}
        onRematch={(chooser) => {
          const { first: _first, seed: _seed, ...rest } = screen.spec;
          setScreen({ kind: 'choose', spec: { ...rest, id: newGameId(), seed: crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1 }, chooser });
        }}
      />
    );
  }
  const over = saved && !saved.session.game.states[saved.session.game.states.length - 1]!.decision;
  return (
    <main class="home">
      <h1>Travel Tabletop v3</h1>
      <p>A rules-enforcing Magic: The Gathering game for two players on one device, with the Avatar card pool.</p>
      {missing && <p class="note" data-testid="missing-game">That game isn't saved on this device.</p>}
      <div class="home-actions">
        {saved && !over && <button class="btn primary" onClick={() => { setMissing(false); setScreen({ kind: 'game', spec: saved.spec, session: saved.session }); }} data-testid="resume">Resume: {saved.spec.names.p1} vs {saved.spec.names.p2}</button>}
        <button class={`btn ${saved && !over ? '' : 'primary'}`} onClick={() => { if (saved && !over) clearSaved(); setSaved(null); setScreen({ kind: 'setup' }); }} data-testid="new-game">New game</button>
      </div>
      {update && <button class="btn primary" onClick={update} data-testid="update-now">Update now: a new version is ready</button>}
      {offlineReady && <p class="dim small" data-testid="offline-ready">Ready to play offline: the app and every card are stored on this device.</p>}
      <p class="pool">Card pool: {pool.packets.length} packets, {cardCount} cards, {pool.tokens.length} tokens.</p>
      <p class="version">v{APP_VERSION} · {BUILD_ID}</p>
    </main>
  );
}
