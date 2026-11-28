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
import { colorsOf, colorVars, hardToTell, PALETTE } from './colors';
import { lastSetup, newGameId, rememberSetup, type GameSpec } from './saved';

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];

export function packetColors(p: Packet): string[] {
  const seen = new Set(p.cards.flatMap((id) => pool.cards[id]!.colors));
  return COLOR_ORDER.filter((c) => seen.has(c));
}

const Pips = ({ colors }: { colors: string[] }) => <span class="pips">{colors.map((c) => <span key={c} class={`pip ${c}`} />)}</span>;

function Picker({ who, name, picked, colors, otherName, onName, onToggle, onColor }: {
  who: PlayerId; name: string; picked: string[]; colors: Record<PlayerId, string>; otherName: string;
  onName: (n: string) => void; onToggle: (id: string) => void; onColor: (id: string) => void;
}) {
  const theirs = colors[other(who)];
  const deckColors = [...new Set(picked.flatMap((id) => packetColors(pool.packets.find((p) => p.id === id)!)))];
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
      <div class="swatches" role="radiogroup" aria-label="Colour">
        {PALETTE.map((c) => (
          <button key={c.id} role="radio" aria-checked={colors[who] === c.id} aria-label={c.id === theirs ? `${c.name}: ${otherName}'s` : c.name}
            class={`swatch ${colors[who] === c.id ? 'on' : ''}`} style={{ '--c': c.role }} disabled={c.id === theirs}
            onClick={() => onColor(c.id)} data-tip={c.id === theirs ? `${otherName} has ${c.name.toLowerCase()}` : `Play as ${c.name.toLowerCase()}`} data-testid={`color-${who}-${c.id}`}>
            {c.id === theirs ? (otherName.trim()[0] ?? '').toUpperCase() : ''}
          </button>
        ))}
      </div>
      {hardToTell(colors.p1, colors.p2) && <p class="color-note" data-testid="color-note">Red and green look alike to some colour-blind players.</p>}
      <p class="deck-line">Deck: {picked.length} of 3 packets · {picked.length * 20} cards <Pips colors={COLOR_ORDER.filter((c) => deckColors.includes(c))} /></p>
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
  const [colors, setColors] = useState<Record<PlayerId, string>>(() => colorsOf(last.colors));
  const [who, setWho] = useState<PlayerId>('p1');
  const [flip, setFlip] = useState<{ seed: number; winner: PlayerId } | null>(null);

  const toggle = (p: PlayerId, id: string) => setPackets((x) => ({ ...x, [p]: x[p].includes(id) ? x[p].filter((y) => y !== id) : [...x[p], id] }));
  const ready = packets.p1.length === 3 && packets.p2.length === 3;

  const flipCoin = () => {
    // ?seed=N fixes the game's randomness, to replay a reported game or for browser tests.
    const fixed = Number(new URLSearchParams(location.search).get('seed'));
    const seed = Number.isInteger(fixed) && fixed > 0 ? fixed : crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1;
    const [n] = nextInt(seedRng(seed), 2);
    rememberSetup({ names, packets, colors });
    setFlip({ seed, winner: n === 0 ? 'p1' : 'p2' });
  };

  if (flip) {
    const start = (first: PlayerId) => onStart({ id: newGameId(), names, packets, colors, first, seed: flip.seed });
    return (
      <main class="setup flip" style={colorVars(colors)}>
        <h2><span class={`who ${flip.winner}`}>{names[flip.winner]}</span> wins the coin flip</h2>
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
    <main class="setup" style={colorVars(colors)}>
      <header class="setup-head">
        <button class="btn" onClick={onBack}>Back</button>
        <div class="tabs">
          {(['p1', 'p2'] as const).map((p) => (
            <button key={p} class={`tab ${who === p ? 'on' : ''} ${p}`} onClick={() => setWho(p)} data-testid={`tab-${p}`}>
              <span class="who">{names[p] || (p === 'p1' ? 'Player 1' : 'Player 2')}</span> · {packets[p].length}/3
            </button>
          ))}
        </div>
      </header>
      <Picker who={who} name={names[who]} picked={packets[who]} colors={colors} otherName={names[other(who)] || (who === 'p1' ? 'Player 2' : 'Player 1')}
        onName={(n) => setNames((x) => ({ ...x, [who]: n }))} onToggle={(id) => toggle(who, id)} onColor={(id) => setColors((x) => ({ ...x, [who]: id }))} />
      <footer class="setup-foot">
        <button class="btn primary" disabled={!ready} onClick={flipCoin} data-testid="start">Start: flip a coin</button>
      </footer>
    </main>
  );
}
