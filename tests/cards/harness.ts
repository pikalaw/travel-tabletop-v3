/**
 * Card tests (technical design, "Testing"): each card's printed behaviour in a small scenario,
 * with the real card data and script. `cardTest` names the test after the card, which is how the
 * coverage test knows every script has one.
 */
import { it } from 'vitest';
import { characteristics } from '../../src/engine/characteristics';
import { start } from '../../src/engine/engine';
import type { CardId, GameState, ObjectId, PlayerId } from '../../src/engine/types';
import { pool } from '../../src/cards/pool';
import { cardData } from '../../src/cards/setup';
import { act, at, keepBoth, passUntil, place } from '../engine-support';

export const cardTest = (name: string, fn: () => void) => it(name, fn);

const byName = new Map<string, CardId>();
for (const c of Object.values(pool.cards)) if (!byName.has(c.name)) byName.set(c.name, c.id);
export function idOf(name: string): CardId {
  const id = byName.get(name);
  if (!id) throw new Error(`no card named ${name}`);
  return id;
}

/** Permanents, hands, p1's graveyard, and the top of p1's library (top card first). */
export interface Board { p1?: string[]; p2?: string[]; hand1?: string[]; hand2?: string[]; graveyard1?: string[]; library1?: string[] }

/**
 * p1's first main phase on turn 1, with these permanents and hands (names from the pool), both
 * libraries full of basic lands. Returns the state and the new objects' ids, in the order given.
 */
export function board(b: Board): { s: GameState; ids: Record<keyof Board, ObjectId[]> } {
  const names = [...(b.p1 ?? []), ...(b.p2 ?? []), ...(b.hand1 ?? []), ...(b.hand2 ?? []), ...(b.graveyard1 ?? []), ...(b.library1 ?? []), 'Plains', 'Island', 'Swamp', 'Mountain', 'Forest'];
  const cards = cardData(names.map(idOf));
  const lib = (land: string) => new Array(40).fill(idOf(land));
  let s = passUntil(keepBoth(start({ players: { p1: { name: 'Lawrence', deck: lib('Plains') }, p2: { name: 'Claire', deck: lib('Forest') } }, cards, first: 'p1' }, 5)), at('main1', 'p1'));
  const ids = {} as Record<keyof Board, ObjectId[]>;
  const put = (p: PlayerId, key: keyof Board, where: 'battlefield' | 'hand' | 'graveyard' | 'library') => { let got: ObjectId[]; [s, got] = place(s, p, (b[key] ?? []).map(idOf), where); ids[key] = got; };
  put('p1', 'p1', 'battlefield'); put('p2', 'p2', 'battlefield'); put('p1', 'hand1', 'hand'); put('p2', 'hand2', 'hand'); put('p1', 'graveyard1', 'graveyard');
  b = { ...b, library1: [...(b.library1 ?? [])].reverse() }; put('p1', 'library1', 'library'); ids.library1.reverse(); // top first
  return { s, ids };
}

export const chars = (s: GameState, id: ObjectId) => characteristics(s, s.objects[id]!);
export const passBoth = (s: GameState) => act(act(s, { kind: 'pass' }), { kind: 'pass' });
/** Passes until the stack is empty and someone has priority again. */
export const settle = (s: GameState) => passUntil(s, (x) => x.zones.stack.length === 0 && x.decision?.kind === 'priority' && x.pendingTriggers.length === 0);
export const named = (s: GameState, name: string, zone: keyof GameState['zones'] = 'battlefield') =>
  s.zones[zone].filter((id) => s.setup.cards[s.objects[id]!.card]!.name === name);
export const lands = (n: number, name = 'Mountain') => new Array(n).fill(name) as string[];
