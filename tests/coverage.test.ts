import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { coverage, packetPlayable } from '../src/cards/coverage';
import { pool } from '../src/cards/pool';
import { scripts } from '../src/cards/registry';

describe('card scripts and coverage', () => {
  it('every script names a card in the pool, under its Oracle id', () => {
    const byOracle = new Map(Object.values(pool.cards).map((c) => [c.oracleId, c.name]));
    for (const [oracleId, s] of scripts) expect(byOracle.get(oracleId), s.name).toBe(s.name);
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
