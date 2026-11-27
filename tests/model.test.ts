/** The board's view model: the numbers it shows and where they came from. */
import { describe, expect, it } from 'vitest';
import { act } from './engine-support';
import { board, lands, passBoth, settle } from './cards/harness';
import { battlefieldRow, beats, landsStrip, ptBreakdown, siblings, stackItems, targetRings } from '../src/ui/model';
import type { GameState } from '../src/engine/types';

describe('the view model', () => {
  it('breaks power and toughness down, and draws an Aura with what it enchants', () => {
    // A breakdown names the printed values, counters and effects with their durations.
    let { s, ids } = board({ p1: ['Komodo Rhino', ...lands(4, 'Forest')], hand1: ['Seismic Tutelage'] });
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(ptBreakdown(s, ids.p1[0]!)).toMatch(/^\d+\/\d+ = \d+\/\d+ printed, \+1\/\+1 counter$/);
    const row = battlefieldRow(s, 'p1');
    expect(row).toHaveLength(1); // the Aura is drawn with what it enchants
    expect(row[0]!.attached).toHaveLength(1);
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

  it('marks a creature that came under its controller\'s control this turn as summoning sick', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(2)], hand1: ['Capital Guard'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const row = battlefieldRow(after, 'p1');
    expect(row.find((p) => p.name === 'Capital Guard')?.sick).toBe(true);
    expect(row.find((p) => p.name === 'Komodo Rhino')?.sick).toBe(false);
  });

  it('steps a full view through the row, strip or hand a card sits in, and never into a hidden hand', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', 'Capital Guard', ...lands(2)], hand1: ['Lightning Strike', 'Capital Guard'] });
    expect(siblings(s, ids.p1[1]!, 'p1')).toEqual([ids.p1[0], ids.p1[1]]);
    expect(siblings(s, ids.p1[2]!, 'p1')).toEqual([ids.p1[2], ids.p1[3]]);
    expect(siblings(s, ids.hand1[0]!, 'p1').slice(-2)).toEqual(ids.hand1);
    expect(siblings(s, ids.hand1[0]!, null)).toEqual([]);
  });

  it('plays back each resolution with what it changed, and skips passes', () => {
    // Seismic Tutelage resolves (the Aura enters), then its trigger resolves (+1/+1 counter on the Rhino).
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(4, 'Forest')], hand1: ['Seismic Tutelage'] });
    const states: GameState[] = [s];
    const push = (c: Parameters<typeof act>[1]) => { states.push(act(states[states.length - 1]!, c)); };
    push({ kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] });
    while (states[states.length - 1]!.zones.stack.length || states[states.length - 1]!.pendingTriggers.length) push({ kind: 'pass' });
    const bs = beats(states, 0, states.length - 1);
    expect(bs.map((b) => b.title)).toEqual(['Seismic Tutelage', "Seismic Tutelage's ability"]);
    expect(bs[1]!.pulses.get(ids.p1[0]!)).toMatchObject({ kind: 'up' });
    expect(bs[1]!.pulses.get(ids.p1[0]!)!.label).toBe('+1/+1 counter'); // named once, as a counter
    expect(bs[1]!.text).toBe('When this Aura enters, put a +1/+1 counter on enchanted creature.');
  });

  it('draws an Aura with what it enchants, whoever controls it, and steps through it in the row', () => {
    // Lawrence casts Path to Redemption on Claire's Capital Guard: it sits in Claire's row, before the Guard.
    const { s, ids } = board({ p1: lands(2, 'Plains'), p2: ['Komodo Rhino', 'Capital Guard'], hand1: ['Path to Redemption'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[1]!]] })));
    const aura = after.zones.battlefield.find((id) => after.objects[id]!.attachedTo === ids.p2[1])!;
    expect(battlefieldRow(after, 'p1').map((p) => p.id)).not.toContain(aura);
    const guard = battlefieldRow(after, 'p2').find((p) => p.id === ids.p2[1])!;
    expect(guard.attached.map((a) => [a.id, a.controller])).toEqual([[aura, 'p1']]);
    expect(siblings(after, aura, null)).toEqual([ids.p2[0], aura, ids.p2[1]]);
  });
});
