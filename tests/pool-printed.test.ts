import { describe, expect, it } from 'vitest';
import { pool } from '../src/cards/pool';
import { printedOf } from '../src/cards/printed';
import { checkInvariants } from '../src/engine/invariants';
import { legalActions } from '../src/engine/engine';
import type { GameSetup } from '../src/engine/types';
import { current, newGame, submit } from '../src/host/controller';

describe('the pool in the engine', () => {
  it('converts every printing to printed characteristics', () => {
    for (const c of Object.values(pool.cards)) {
      const p = printedOf(c);
      if (!c.token) expect(p.types.length, c.name).toBeGreaterThan(0); // the Copy token's types come from what it copies
      if (p.types.includes('Creature') && !c.token) expect(p.power, c.name).toBeTypeOf('number');
    }
    const sokka = Object.values(pool.cards).find((c) => c.name === 'Sokka, Lateral Strategist')!;
    expect(printedOf(sokka)).toMatchObject({ supertypes: ['Legendary'], types: ['Creature'], subtypes: ['Human', 'Warrior', 'Ally'], power: 2, toughness: 4 });
  });

  it('plays three real packets a side for 300 decisions without breaking an invariant (cards as vanilla, until M2)', () => {
    const cards = Object.fromEntries(Object.values(pool.cards).map((c) => [c.id, printedOf(c)]));
    const deck = (ids: string[]) => pool.packets.filter((p) => ids.includes(p.id)).flatMap((p) => p.cards);
    const setup: GameSetup = {
      players: { p1: { name: 'Lawrence', deck: deck(['js-firebending-1', 'bb-allies', 'bb-firebending']) }, p2: { name: 'Claire', deck: deck(['js-earthbending-1', 'bb-earthbending', 'js-lessons-1']) } },
      cards, first: 'p1',
    };
    expect(setup.players.p1.deck).toHaveLength(60);
    expect(setup.players.p2.deck).toHaveLength(60);
    let g = newGame(setup, 9);
    for (let i = 0; i < 300 && !current(g).result; i++) {
      const s = current(g);
      const d = s.decision!;
      const c = d.kind === 'priority' || d.kind === 'mulligan' ? legalActions(s).find((x) => x.kind !== 'mulligan' && x.kind !== 'pass') ?? legalActions(s)[0]!
        : d.kind === 'attackers' ? { kind: 'attack' as const, attackers: [] }
        : d.kind === 'blockers' ? { kind: 'block' as const, blocks: [] }
        : d.kind === 'discard' || d.kind === 'bottom' ? { kind: d.kind, cards: s.zones[`${d.player}.hand`].slice(0, d.count) }
        : d.kind === 'legend' ? { kind: 'legend' as const, keep: d.objects[0]! }
        : { kind: 'pass' as const };
      const next = submit(g, c);
      if ('refused' in next) throw new Error(next.refused);
      g = next;
      expect(checkInvariants(current(g))).toEqual([]);
    }
    expect(current(g).turn).toBeGreaterThan(3);
  });
});
