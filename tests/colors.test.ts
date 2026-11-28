import { describe, expect, it } from 'vitest';
import { colorsOf, colorVars, DEFAULT_COLORS, hardToTell, PALETTE } from '../src/ui/colors';

describe('player colours', () => {
  it('keeps two valid, different picks', () => {
    expect(colorsOf({ p1: 'green', p2: 'purple' })).toEqual({ p1: 'green', p2: 'purple' });
  });

  it('never gives both players the same colour, and falls back to red and blue', () => {
    expect(colorsOf({ p1: 'teal', p2: 'teal' })).toEqual({ p1: 'teal', p2: 'blue' });
    expect(colorsOf({ p1: 'blue', p2: 'blue' })).toEqual({ p1: 'blue', p2: 'red' });
    expect(colorsOf(undefined)).toEqual(DEFAULT_COLORS);
    expect(colorsOf({ p1: 'gold', p2: 'nope' })).toEqual(DEFAULT_COLORS);
    for (const a of PALETTE) for (const b of PALETTE) {
      const c = colorsOf({ p1: a.id, p2: b.id });
      expect(c.p1).not.toBe(c.p2);
    }
  });

  it('sets the variables .p1 and .p2 read', () => {
    expect(colorVars({ p1: 'green', p2: 'red' })).toMatchObject({ '--p1-role': '#62d68f', '--p2-tint': '214, 64, 52' });
  });

  it('flags red with green', () => {
    expect(hardToTell('green', 'red')).toBe(true);
    expect(hardToTell('red', 'blue')).toBe(false);
  });
});
