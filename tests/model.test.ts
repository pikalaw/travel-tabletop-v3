/** The board's view model: the numbers it shows and where they came from. */
import { describe, expect, it } from 'vitest';
import { act } from './engine-support';
import { board, lands, passBoth, settle } from './cards/harness';
import { battlefieldRow, landsStrip, ptBreakdown, stackItems, targetRings } from '../src/ui/model';

describe('the view model', () => {
  it('breaks power and toughness down, and draws an Aura with what it enchants', () => {
    // A breakdown names the printed values, counters and effects with their durations.
    let { s, ids } = board({ p1: ['Komodo Rhino', ...lands(4, 'Forest')], hand1: ['Seismic Tutelage'] });
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(ptBreakdown(s, ids.p1[0]!)).toMatch(/^\d+\/\d+ = \d+\/\d+ printed, \+1\/\+1 counter$/);
    const row = battlefieldRow(s, 'p1');
    expect(row).toHaveLength(1); // the Aura is drawn with what it enchants
    expect(row[0]!.auras).toHaveLength(1);
    expect(row[0]!.pt?.up).toBe(true);
    expect(landsStrip(s, 'p1').chips).toEqual([expect.objectContaining({ name: 'Forest', pips: expect.any(Array) })]);
  });

  it('names a stack item\'s targets and rings them in the caster\'s colour', () => {
    // A spell on the stack names its target, and the target carries ring 1 in the caster's colour.
    const { s, ids } = board({ p1: lands(2), p2: ['Capital Guard'], hand1: ['Lightning Strike'] });
    const cast = act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] });
    expect(stackItems(cast)[0]).toMatchObject({ n: 1, name: 'Lightning Strike', controller: 'p1', targets: 'Capital Guard', targetsGone: false });
    expect(targetRings(cast).get(ids.p2[0]!)).toEqual([{ n: 1, controller: 'p1' }]);
  });
});
