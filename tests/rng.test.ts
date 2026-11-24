import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { nextInt, nextUint32, seedRng, shuffle } from '../src/engine/rng';

describe('seeded random source', () => {
  it('draws the same numbers from the same seed', () => {
    const draw = (seed: number) => {
      let s = seedRng(seed);
      const out: number[] = [];
      for (let i = 0; i < 5; i++) { const [x, s2] = nextUint32(s); out.push(x); s = s2; }
      return out;
    };
    expect(draw(42)).toEqual(draw(42));
    expect(draw(42)).not.toEqual(draw(43));
  });

  it('never leaves the state all zero', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), (seed) => seedRng(seed).some((w) => w !== 0)));
  });

  it('keeps nextInt within its bound', () => {
    fc.assert(fc.property(fc.integer(), fc.integer({ min: 1, max: 1000 }), (seed, n) => {
      const [x] = nextInt(seedRng(seed), n);
      return Number.isInteger(x) && x >= 0 && x < n;
    }));
  });

  it('shuffles into a permutation, the same one for the same seed', () => {
    fc.assert(fc.property(fc.integer(), fc.array(fc.integer(), { maxLength: 60 }), (seed, items) => {
      const [a] = shuffle(seedRng(seed), items);
      const [b] = shuffle(seedRng(seed), items);
      expect(a).toEqual(b);
      expect([...a].sort((x, y) => x - y)).toEqual([...items].sort((x, y) => x - y));
    }));
  });

  it('spreads a 60-card shuffle evenly over the top position', () => {
    const counts = new Array(60).fill(0);
    let s = seedRng(7);
    const deck = Array.from({ length: 60 }, (_, i) => i);
    for (let i = 0; i < 6000; i++) { const [d, s2] = shuffle(s, deck); counts[d[0]]++; s = s2; }
    // 100 expected per card; a fair shuffle stays well inside 40..160 at this sample size.
    expect(Math.min(...counts)).toBeGreaterThan(40);
    expect(Math.max(...counts)).toBeLessThan(160);
  });
});
