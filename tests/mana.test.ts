import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { manaValue, parseCost, solvePayment, type ManaSource } from '../src/engine/mana';
import type { Color } from '../src/engine/types';

const land = (id: string, ...makes: (Color | 'C')[]): ManaSource => ({ id, makes });

describe('mana costs', () => {
  it('parses generic, coloured, hybrid, colourless and X symbols', () => {
    expect(parseCost('{2}{W/U}{R}{C}{X}')).toEqual([
      { kind: 'generic', amount: 2 }, { kind: 'hybrid', colors: ['W', 'U'] }, { kind: 'color', color: 'R' },
      { kind: 'colorless' }, { kind: 'x' },
    ]);
    expect(manaValue(parseCost('{1}{W/U}{W/U}'))).toBe(3);
    expect(parseCost('')).toEqual([]);
  });
});

describe('the payment solver', () => {
  it('pays coloured symbols from the right sources and generic from any', () => {
    const pay = solvePayment(parseCost('{1}{R}'), [land('m', 'R'), land('p', 'W')]);
    expect(pay?.sources.sort()).toEqual(['m', 'p']);
  });

  it('finds the matching when a greedy order would fail', () => {
    // A dual land must pay U, so the Plains pays W: greedy W-first from the dual would get stuck.
    const pay = solvePayment(parseCost('{W}{U}'), [land('dual', 'W', 'U'), land('plains', 'W')]);
    expect(pay?.sources.sort()).toEqual(['dual', 'plains']);
  });

  it('pays hybrid with either colour', () => {
    expect(solvePayment(parseCost('{W/U}{W/U}'), [land('a', 'U'), land('b', 'W')])).not.toBeNull();
    expect(solvePayment(parseCost('{W/U}'), [land('a', 'R')])).toBeNull();
  });

  it('refuses a cost with too few sources or a missing colour', () => {
    expect(solvePayment(parseCost('{2}{R}'), [land('a', 'R'), land('b', 'R')])).toBeNull();
    expect(solvePayment(parseCost('{G}'), [land('a', 'R'), land('b', 'W')])).toBeNull();
  });

  it('keeps the flexible source untapped when it can', () => {
    const pay = solvePayment(parseCost('{1}'), [land('dual', 'W', 'U'), land('plains', 'W')]);
    expect(pay?.sources).toEqual(['plains']);
  });

  it('spends floating mana first', () => {
    const pay = solvePayment(parseCost('{1}'), [land('plains', 'W'), { id: 'pool', makes: ['R'], floating: true }]);
    expect(pay?.sources).toEqual(['pool']);
  });

  it('agrees with brute force on small random cases', () => {
    const colors: (Color | 'C')[] = ['W', 'U', 'B', 'R', 'G', 'C'];
    const arbSource = fc.subarray(colors, { minLength: 1, maxLength: 2 });
    const arbSym = fc.oneof(
      fc.constantFrom(...(['W', 'U', 'B', 'R', 'G'] as Color[])).map((c) => `{${c}}`),
      fc.integer({ min: 1, max: 2 }).map((n) => `{${n}}`),
      fc.constantFrom('{W/U}', '{B/R}', '{G/W}', '{C}'),
    );
    fc.assert(fc.property(fc.array(arbSource, { maxLength: 5 }), fc.array(arbSym, { maxLength: 4 }), (srcs, syms) => {
      const sources = srcs.map((makes, i) => land(`s${i}`, ...makes));
      const cost = parseCost(syms.join(''));
      const pay = solvePayment(cost, sources);
      const brute = bruteForce(cost, sources);
      expect(pay !== null).toBe(brute);
      if (pay) expect(new Set(pay.sources).size).toBe(pay.sources.length);
    }));
  });
});

/** Tries every assignment of distinct sources to symbols. */
function bruteForce(cost: ReturnType<typeof parseCost>, sources: ManaSource[]): boolean {
  const units = cost.flatMap((s) => (s.kind === 'generic' ? new Array(s.amount).fill(null) : s.kind === 'x' ? [] : [s]));
  const used = new Array(sources.length).fill(false);
  const ok = (i: number): boolean => {
    if (i === units.length) return true;
    const s = units[i];
    for (let j = 0; j < sources.length; j++) {
      if (used[j]) continue;
      const m = sources[j]!.makes;
      const fits = s === null || (s.kind === 'color' ? m.includes(s.color) : s.kind === 'hybrid' ? s.colors.some((c: Color) => m.includes(c)) : s.kind === 'colorless' ? m.includes('C') : true);
      if (!fits) continue;
      used[j] = true;
      if (ok(i + 1)) return true;
      used[j] = false;
    }
    return false;
  };
  return ok(0);
}
