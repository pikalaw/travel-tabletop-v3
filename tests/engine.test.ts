import { describe, expect, it } from 'vitest';
import { legalActions, start } from '../src/engine/engine';
import { zoneOf } from '../src/engine/state';
import type { GameState } from '../src/engine/types';
import { act, at, decisionIs, emptyLibrary, handIds, keepBoth, lifeOf, onBattlefield, passUntil, place, refused, setup } from './engine-support';

const begin = (seed = 1) => keepBoth(start(setup(), seed));

describe('the start of the game', () => {
  it('deals seven cards each and asks the first player about a mulligan', () => {
    const s = start(setup(), 1);
    expect(handIds(s, 'p1')).toHaveLength(7);
    expect(handIds(s, 'p2')).toHaveLength(7);
    expect(s.decision).toEqual({ kind: 'mulligan', player: 'p1' });
  });

  it('is the same game from the same seed', () => {
    expect(start(setup(), 42)).toEqual(start(setup(), 42));
    expect(start(setup(), 42).zones).not.toEqual(start(setup(), 43).zones);
  });

  it('London mulligan: a new seven, then one card to the bottom per mulligan', () => {
    let s = start(setup(), 1);
    s = act(s, { kind: 'mulligan' });
    expect(handIds(s, 'p1')).toHaveLength(7);
    s = act(s, { kind: 'keep' });
    expect(s.decision).toEqual({ kind: 'bottom', player: 'p1', count: 1 });
    expect(refused(s, { kind: 'bottom', cards: [] })).toMatch(/exactly 1/);
    const chosen = handIds(s, 'p1')[0]!;
    const card = s.objects[chosen]!.card;
    s = act(s, { kind: 'bottom', cards: [chosen] });
    expect(handIds(s, 'p1')).toHaveLength(6);
    const bottom = s.zones['p1.library'][0]!;
    expect(bottom).not.toBe(chosen); // a new object (400.7) ...
    expect(s.objects[bottom]!.card).toBe(card); // ... for the same card, at the bottom
    expect(s.decision).toEqual({ kind: 'mulligan', player: 'p2' });
  });

  it('starts turn 1 with the first player in their upkeep, and they skip their first draw', () => {
    let s = begin();
    expect(s.turn).toBe(1);
    expect(s.decision).toEqual({ kind: 'priority', player: 'p1' });
    expect(s.step).toBe('upkeep');
    s = passUntil(s, at('main1'));
    expect(handIds(s, 'p1')).toHaveLength(7);
    s = passUntil(s, (x) => x.turn === 2 && at('main1')(x));
    expect(handIds(s, 'p2')).toHaveLength(8);
  });
});

describe('priority', () => {
  it('moves to the next step only when both players pass in a row', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    s = act(s, { kind: 'pass' });
    expect(s.step).toBe('main1');
    expect(s.decision).toEqual({ kind: 'priority', player: 'p2' });
    s = act(s, { kind: 'pass' });
    expect(s.step).toBe('beginCombat');
  });

  it('refuses an answer of the wrong kind', () => {
    expect(refused(begin(), { kind: 'keep' })).toMatch(/Expected/);
  });
});

describe('lands', () => {
  it('one per turn, in your main phase', () => {
    let s = begin();
    const land = () => handIds(s, 'p1').find((id) => s.objects[id]!.card === 'mountain')!;
    expect(refused(s, { kind: 'play', object: land() })).toMatch(/main phase/);
    s = passUntil(s, at('main1', 'p1'));
    s = act(s, { kind: 'play', object: land() });
    expect(onBattlefield(s, 'Mountain')).toBe(1);
    expect(s.decision).toEqual({ kind: 'priority', player: 'p1' }); // playing a land keeps priority
    expect(refused(s, { kind: 'play', object: land() })).toMatch(/played a land/);
  });
});

describe('casting', () => {
  it('pays from untapped lands, uses the stack, and resolves when both pass', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    let ogre: string;
    [s] = place(s, 'p1', ['mountain', 'mountain', 'mountain']);
    [s, [ogre]] = place(s, 'p1', ['ogre'], 'hand') as [GameState, [string]];
    expect(legalActions(s)).toContainEqual({ kind: 'cast', object: ogre });
    s = act(s, { kind: 'cast', object: ogre });
    expect(s.zones.stack).toHaveLength(1);
    expect(s.zones.battlefield.filter((id) => s.objects[id]!.tapped)).toHaveLength(3);
    expect(s.decision).toEqual({ kind: 'priority', player: 'p1' }); // 117.3c: the caster gets priority
    s = act(act(s, { kind: 'pass' }), { kind: 'pass' });
    expect(s.zones.stack).toHaveLength(0);
    expect(onBattlefield(s, 'Gray Ogre')).toBe(1);
    expect(s.decision).toEqual({ kind: 'priority', player: 'p1' }); // 117.3b: the active player after resolving
  });

  it('refuses without enough mana of the right colour, and outside the main phase', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    let bear: string;
    [s] = place(s, 'p1', ['mountain', 'mountain']);
    [s, [bear]] = place(s, 'p1', ['bear'], 'hand') as [GameState, [string]];
    expect(refused(s, { kind: 'cast', object: bear })).toMatch(/mana/);
    [s] = place(s, 'p1', ['forest']);
    s = passUntil(s, at('beginCombat', 'p1'));
    expect(refused(s, { kind: 'cast', object: bear })).toMatch(/main phase/);
  });

  it('empties floating mana between steps', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    s = structuredClone(s);
    s.players.p1.pool.R = 2;
    s = act(act(s, { kind: 'pass' }), { kind: 'pass' });
    expect(s.players.p1.pool.R).toBe(0);
  });
});

describe('the end of the turn', () => {
  it('discards down to seven in cleanup, and damage wears off', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    [s] = place(s, 'p1', ['ogre', 'ogre'], 'hand');
    s = passUntil(s, decisionIs('discard'));
    expect(s.decision).toEqual({ kind: 'discard', player: 'p1', count: 2 });
    s = act(s, { kind: 'discard', cards: handIds(s, 'p1').slice(0, 2) });
    expect(handIds(s, 'p1')).toHaveLength(7);
    expect(s.zones[zoneOf('p1', 'graveyard')]).toHaveLength(2);
    expect(s.turn).toBe(2);
  });
});

describe('losing', () => {
  it('a player who must draw from an empty library loses', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    s = emptyLibrary(s, 'p2');
    s = passUntil(s, (x) => x.result !== null);
    expect(s.result).toEqual({ winner: 'p1', reason: 'Claire drew from an empty library' });
    expect(s.decision).toBeNull();
  });

  it('a player at 0 life loses', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    s = structuredClone(s);
    s.players.p2.life = 0;
    s = act(s, { kind: 'pass' });
    expect(s.result?.winner).toBe('p1');
    expect(lifeOf(s, 'p2')).toBe(0);
  });
});

describe('the legend rule', () => {
  it('asks which one to keep', () => {
    let s = passUntil(begin(), at('main1', 'p1'));
    let ids: string[];
    [s, ids] = place(s, 'p1', ['hero', 'hero']);
    s = act(s, { kind: 'pass' });
    expect(s.decision).toEqual({ kind: 'legend', player: 'p1', name: 'Unique Hero', objects: ids });
    s = act(s, { kind: 'legend', keep: ids[1]! });
    expect(onBattlefield(s, 'Unique Hero')).toBe(1);
    expect(s.objects[ids[1]!]).toBeDefined();
  });
});
