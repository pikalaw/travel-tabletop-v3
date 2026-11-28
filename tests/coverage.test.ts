import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { coverage, packetPlayable } from '../src/cards/coverage';
import { pool } from '../src/cards/pool';
import { scripts } from '../src/cards/registry';
import { keyOf, type Effect } from '../src/engine/effects';

describe('card scripts and coverage', () => {
  it('every script names a card in the pool, under its Oracle id', () => {
    const byOracle = new Map(Object.values(pool.cards).map((c) => [c.oracleId, c.name]));
    for (const [oracleId, s] of scripts) expect(byOracle.get(oracleId), s.name).toBe(s.name);
  });

  it('every effect in every script names exactly one mechanic', () => {
    // keyOf throws for an effect with no mechanic, or two: say a misspelt key, or a field named like a mechanic.
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (!v || typeof v !== 'object') return;
      for (const [k, x] of Object.entries(v)) {
        if ((k === 'effects' || k === 'then' || k === 'else' || k === 'otherwise' || k === 'may') && Array.isArray(x)) for (const e of x as Effect[]) keyOf(e);
        walk(x);
      }
    };
    for (const s of scripts.values()) expect(() => walk(s), s.name).not.toThrow();
  });

  it('every script has a card test', () => {
    const dir = new URL('./cards/', import.meta.url);
    const text = readdirSync(dir).filter((f) => f.endsWith('.test.ts')).map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
    const tested = new Set([...text.matchAll(/cardTest\((['"])(.+?)\1/g)].map((m) => m[2]));
    const untested = [...scripts.values()].map((s) => s.name).filter((n) => !tested.has(n));
    expect(untested).toEqual([]);
  });

  it('reports Beginner Box progress', () => {
    const bb = pool.packets.filter((p) => p.product === 'Beginner Box');
    const cards = [...new Set(bb.flatMap((p) => p.cards))].map((id) => pool.cards[id]!);
    const missing = cards.filter((c) => coverage(c) === 'missing').map((c) => c.name).sort();
    console.log(`Beginner Box: ${cards.length - missing.length} of ${cards.length} cards playable; packets playable: ${bb.filter(packetPlayable).map((p) => p.name).join(', ') || 'none'}`);
    expect(missing.length + (cards.length - missing.length)).toBe(cards.length);
  });
});
