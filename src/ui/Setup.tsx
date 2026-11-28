/**
 * Game setup (PRD, "Format" and "Picking packets"): each player names themselves and ticks exactly
 * three different packets; a seeded coin flip picks who chooses to play or draw.
 */
import { useState } from 'preact/hooks';
import { packetPlayable } from '../cards/coverage';
import { pool } from '../cards/pool';
import type { Packet } from '../cards/types';
import { nextInt, seedRng } from '../engine/rng';
import type { PlayerId } from '../engine/types';
import { other } from '../engine/types';
import { lastSetup, newGameId, rememberSetup, type GameSpec } from './saved';

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];

export function packetColors(p: Packet): string[] {
  const seen = new Set(p.cards.flatMap((id) => pool.cards[id]!.colors));
  return COLOR_ORDER.filter((c) => seen.has(c));
}

const Pips = ({ colors }: { colors: string[] }) => <span class="pips">{colors.map((c) => <span key={c} class={`pip ${c}`} />)}</span>;

function Picker({ who, name, picked, onName, onToggle }: {
  who: PlayerId; name: string; picked: string[];
  onName: (n: string) => void; onToggle: (id: string) => void;
}) {
  const colors = [...new Set(picked.flatMap((id) => packetColors(pool.packets.find((p) => p.id === id)!)))];
  const groups: [string, Packet[]][] = [
    ['Beginner Box', pool.packets.filter((p) => p.product === 'Beginner Box')],
    ['Jumpstart', pool.packets.filter((p) => p.product === 'Jumpstart')],
  ];
  return (
    <section class={`picker ${who}`}>
      <label class="name-field">
        <span>Player {who === 'p1' ? 1 : 2}</span>
        <input value={name} maxLength={16} onInput={(e) => onName((e.target as HTMLInputElement).value)} data-testid={`name-${who}`} />
      </label>
      <p class="deck-line">Deck: {picked.length} of 3 packets · {picked.length * 20} cards <Pips colors={COLOR_ORDER.filter((c) => colors.includes(c))} /></p>
      {groups.map(([title, packets]) => (
        <div key={title}>
          <h3>{title}</h3>
          <ul class="packets">
            {packets.map((p) => {
              const ok = packetPlayable(p);
              const on = picked.includes(p.id);
              return (
                <li key={p.id}>
                  <button class={`packet ${on ? 'on' : ''}`} disabled={!ok || (!on && picked.length >= 3)} onClick={() => onToggle(p.id)} data-testid={`packet-${who}-${p.id}`}>
                    <span class="packet-name">{p.name.replace(/^Avatar (BB|JS): /, '')}</span>
                    {ok ? <Pips colors={packetColors(p)} /> : <span class="dim">not yet playable</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function Setup({ onStart, onBack }: { onStart: (spec: GameSpec) => void; onBack: () => void }) {
  const last = lastSetup();
  const [names, setNames] = useState<Record<PlayerId, string>>(last.names ?? { p1: 'Player 1', p2: 'Player 2' });
  const [packets, setPackets] = useState<Record<PlayerId, string[]>>(() => {
    const keep = (ids?: string[]) => (ids ?? []).filter((id) => { const p = pool.packets.find((x) => x.id === id); return p && packetPlayable(p); });
    return { p1: keep(last.packets?.p1), p2: keep(last.packets?.p2) };
  });
  const [who, setWho] = useState<PlayerId>('p1');
  const [flip, setFlip] = useState<{ seed: number; winner: PlayerId } | null>(null);

  const toggle = (p: PlayerId, id: string) => setPackets((x) => ({ ...x, [p]: x[p].includes(id) ? x[p].filter((y) => y !== id) : [...x[p], id] }));
  const ready = packets.p1.length === 3 && packets.p2.length === 3;

  const flipCoin = () => {
    // ?seed=N fixes the game's randomness, to replay a reported game or for browser tests.
    const fixed = Number(new URLSearchParams(location.search).get('seed'));
    const seed = Number.isInteger(fixed) && fixed > 0 ? fixed : crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1;
    const [n] = nextInt(seedRng(seed), 2);
    rememberSetup({ names, packets });
    setFlip({ seed, winner: n === 0 ? 'p1' : 'p2' });
  };

  if (flip) {
    const start = (first: PlayerId) => onStart({ id: newGameId(), names, packets, first, seed: flip.seed });
    return (
      <main class="setup flip">
        <h2>{names[flip.winner]} wins the coin flip</h2>
        <p class="dim">{names[flip.winner]} chooses:</p>
        <div class="choices">
          <button class="btn primary" onClick={() => start(flip.winner)} data-testid="play-first">Play first</button>
          <button class="btn" onClick={() => start(other(flip.winner))} data-testid="draw-first">Draw first</button>
        </div>
        <p class="dim small">Whoever plays first skips the draw on turn 1.</p>
      </main>
    );
  }

  return (
    <main class="setup">
      <header class="setup-head">
        <button class="btn" onClick={onBack}>Back</button>
        <div class="tabs">
          {(['p1', 'p2'] as const).map((p) => (
            <button key={p} class={`tab ${who === p ? 'on' : ''} ${p}`} onClick={() => setWho(p)} data-testid={`tab-${p}`}>
              {names[p] || (p === 'p1' ? 'Player 1' : 'Player 2')} · {packets[p].length}/3
            </button>
          ))}
        </div>
      </header>
      <Picker who={who} name={names[who]} picked={packets[who]} onName={(n) => setNames((x) => ({ ...x, [who]: n }))} onToggle={(id) => toggle(who, id)} />
      <footer class="setup-foot">
        <button class="btn primary" disabled={!ready} onClick={flipCoin} data-testid="start">Start: flip a coin</button>
      </footer>
    </main>
  );
}
