/**
 * Test support for the engine: made-up vanilla cards, setups, a scenario builder that puts cards
 * where a test needs them, and helpers that pass priority until something happens.
 */
import { expect } from 'vitest';
import { answer, blockCandidates } from '../src/engine/engine';
import { parseCost } from '../src/engine/mana';
import { createObject, move, zoneOf } from '../src/engine/state';
import type { CardId, Choice, GameSetup, GameState, ObjectId, PlayerId, Printed, Step } from '../src/engine/types';

export function creature(name: string, cost: string, power: number, toughness: number, keywords: string[] = [], supertypes: string[] = []): Printed {
  return { name, oracleId: name, manaCost: parseCost(cost), supertypes, types: ['Creature'], subtypes: [], power, toughness, keywords, text: keywords.join(', ') };
}
export function basic(name: 'Plains' | 'Island' | 'Swamp' | 'Mountain' | 'Forest'): Printed {
  return { name, oracleId: name, manaCost: [], supertypes: ['Basic'], types: ['Land'], subtypes: [name], keywords: [], text: '' };
}

export const CARDS: Record<CardId, Printed> = {
  mountain: basic('Mountain'), forest: basic('Forest'), plains: basic('Plains'), island: basic('Island'), swamp: basic('Swamp'),
  bear: creature('Grizzly Bears', '{1}{G}', 2, 2),
  ogre: creature('Gray Ogre', '{2}{R}', 2, 2),
  giant: creature('Hill Giant', '{3}{R}', 3, 3),
  wall: creature('Wall of Wood', '{G}', 0, 3, ['Defender']),
  knight: creature('Striking Knight', '{1}{W}', 2, 2, ['First strike']),
  viper: creature('Deathtouch Viper', '{B}', 1, 1, ['Deathtouch']),
  cleric: creature('Lifelink Cleric', '{1}{W}', 2, 2, ['Lifelink']),
  rhino: creature('Trampling Rhino', '{3}{G}', 4, 4, ['Trample']),
  bird: creature('Sky Bird', '{1}{W}', 1, 1, ['Flying']),
  spider: creature('Reach Spider', '{1}{G}', 1, 3, ['Reach']),
  goblin: creature('Menace Goblin', '{R}', 1, 1, ['Menace']),
  twin: creature('Double Duelist', '{2}{W}', 2, 2, ['Double strike']),
  hero: creature('Unique Hero', '{1}{W}', 2, 2, [], ['Legendary']),
};

/** A 40-card deck: 17 lands of `land`, the rest from `spells` in turn. */
export function deck(land: CardId, spells: CardId[], size = 40): CardId[] {
  const out: CardId[] = [];
  for (let i = 0; i < 17; i++) out.push(land);
  for (let i = 0; out.length < size; i++) out.push(spells[i % spells.length]!);
  return out;
}

export function setup(d1: CardId[] = deck('mountain', ['ogre', 'giant']), d2: CardId[] = deck('forest', ['bear', 'rhino']), first: PlayerId = 'p1'): GameSetup {
  return { players: { p1: { name: 'Lawrence', deck: d1 }, p2: { name: 'Claire', deck: d2 } }, cards: CARDS, first };
}

/** Answers, failing the test on a refusal. */
export function act(s: GameState, c: Choice): GameState {
  const r = answer(s, c);
  if ('refused' in r) throw new Error(`refused: ${r.refused} (decision ${JSON.stringify(s.decision)}, choice ${JSON.stringify(c)})`);
  return r;
}

export function refused(s: GameState, c: Choice): string {
  const r = answer(s, c);
  expect('refused' in r, `expected ${JSON.stringify(c)} to be refused`).toBe(true);
  return (r as { refused: string }).refused;
}

/** Both players keep. */
export const keepBoth = (s: GameState) => act(act(s, { kind: 'keep' }), { kind: 'keep' });

/** Answers every decision with "nothing" (pass, no attack, no block) until `until` holds. */
export function passUntil(s: GameState, until: (s: GameState) => boolean, limit = 500): GameState {
  for (let i = 0; i < limit; i++) {
    if (until(s)) return s;
    const d = s.decision;
    if (!d) throw new Error('no decision, and the condition never held');
    if (d.kind === 'priority') s = act(s, { kind: 'pass' });
    else if (d.kind === 'attackers') s = act(s, { kind: 'attack', attackers: [] });
    else if (d.kind === 'blockers') s = act(s, { kind: 'block', blocks: [] });
    else if (d.kind === 'discard') s = act(s, { kind: 'discard', cards: s.zones[`${d.player}.hand`].slice(0, d.count) });
    else throw new Error(`passUntil can't answer ${d.kind}`);
  }
  throw new Error('passUntil ran out of steps');
}

export const at = (step: Step, player?: PlayerId) => (s: GameState) =>
  s.step === step && s.decision?.kind === 'priority' && (player === undefined || s.decision.player === player);

export const decisionIs = (kind: string) => (s: GameState) => s.decision?.kind === kind;

/**
 * Puts cards straight onto the battlefield (untapped, not summoning-sick) or into a hand, for
 * tests that start from a position. Returns the new state and the objects' ids.
 */
/** Puts new objects into a zone; onto a library they go on top, the last one topmost. */
export function place(s: GameState, p: PlayerId, cards: CardId[], where: 'battlefield' | 'hand' | 'library' | 'graveyard' = 'battlefield'): [GameState, ObjectId[]] {
  const n = structuredClone(s);
  n.setup.cards = { ...CARDS, ...n.setup.cards };
  const ids = cards.map((c) => {
    const o = createObject(n, c, p, where === 'battlefield' ? 'battlefield' : zoneOf(p, where));
    o.controlledSince = -1;
    return o.id;
  });
  return [n, ids];
}

/** Empties a player's library into exile, for the empty-library rule. */
export function emptyLibrary(s: GameState, p: PlayerId): GameState {
  const n = structuredClone(s);
  for (const id of [...n.zones[zoneOf(p, 'library')]]) move(n, id, zoneOf(p, 'exile'));
  return n;
}

export const lifeOf = (s: GameState, p: PlayerId) => s.players[p].life;
export const onBattlefield = (s: GameState, name: string) => s.zones.battlefield.filter((id) => s.setup.cards[s.objects[id]!.card]!.name === name).length;
export const handIds = (s: GameState, p: PlayerId) => s.zones[zoneOf(p, 'hand')];
export { blockCandidates };
