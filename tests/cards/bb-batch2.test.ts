/** Beginner Box cards, batch 2: firebending, earthbend, waterbend, airbend, exhaust, characteristic-defining power. */
import { describe, expect } from 'vitest';
import type { GameState } from '../../src/engine/types';
import { act, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const combatMana = (s: GameState) => s.players.p1.combatPool.R;

describe('Beginner Box, batch 2', () => {
  cardTest('Fire Sages', () => {
    let { s, ids } = board({ p1: ['Fire Sages'] });
    s = settle(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }));
    expect(combatMana(s)).toBe(1); // firebending 1: {R} until end of combat
    s = passUntil(s, (x) => x.step === 'main2');
    expect(combatMana(s)).toBe(0);
    const pump = board({ p1: ['Fire Sages', ...lands(3)] });
    expect(chars(passBoth(act(pump.s, { kind: 'activate', object: pump.ids.p1[0]!, ability: 0 })), pump.ids.p1[0]!).power).toBe(3);
  });

  cardTest('Loyal Fire Sage', () => {
    const { s, ids } = board({ p1: ['Loyal Fire Sage', ...lands(5)] });
    expect(named(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })), 'Ally')).toHaveLength(1);
  });

  cardTest('Rough Rhino Cavalry', () => {
    let { s, ids } = board({ p1: ['Rough Rhino Cavalry', ...lands(8)] });
    s = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 7, keywords: expect.arrayContaining(['trample']) });
    s = structuredClone(s);
    for (const id of s.zones.battlefield) s.objects[id]!.tapped = false;
    expect(refused(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })).toMatch(/Exhaust/);
  });

  cardTest('Vindictive Warden', () => {
    const { s, ids } = board({ p1: ['Vindictive Warden', ...lands(3)] });
    expect(lifeOf(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })), 'p2')).toBe(19);
  });

  cardTest('Earthbending Lesson', () => {
    let { s, ids } = board({ p1: lands(4, 'Forest'), hand1: ['Earthbending Lesson'] });
    const land = ids.p1[0]!;
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[land]] }));
    expect(chars(s, land)).toMatchObject({ types: ['Land', 'Creature'], power: 4, toughness: 4, keywords: ['haste'] });
    // It dies: it comes back tapped, as a land again.
    s = structuredClone(s); s.objects[land]!.damage = 4;
    s = settle(act(s, { kind: 'pass' }));
    const back = named(s, 'Forest').map((id) => s.objects[id]!).find((o) => o.tapped && o.id !== land);
    expect(back).toBeDefined();
    expect(chars(s, back!.id).types).toEqual(['Land']);
  });

  cardTest('Badgermole', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(5, 'Forest')], hand1: ['Badgermole'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = settle(act(after, { kind: 'targets', targets: [[ids.p1[1]!]] }));
    expect(chars(after, ids.p1[1]!).keywords).toEqual(expect.arrayContaining(['haste', 'trample'])); // the land has counters
    expect(chars(after, ids.p1[0]!).keywords).not.toContain('trample');
  });

  cardTest('Earth Village Ruffians', () => {
    const { s, ids } = board({ p1: ['Earth Village Ruffians', 'Forest', ...lands(2)], hand1: ['Lightning Strike'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] }));
    expect(after.decision).toMatchObject({ kind: 'triggerTargets', player: 'p1' }); // three lands to choose from
    after = settle(act(after, { kind: 'targets', targets: [[ids.p1[1]!]] }));
    expect(chars(after, ids.p1[1]!)).toMatchObject({ power: 2, toughness: 2 });
  });

  cardTest('Haru, Hidden Talent', () => {
    const { s, ids } = board({ p1: ['Haru, Hidden Talent', 'Forest', 'Plains'], hand1: ['Kyoshi Warrior Guard'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = settle(act(after, { kind: 'targets', targets: [[ids.p1[1]!]] }));
    expect(chars(after, ids.p1[1]!)).toMatchObject({ power: 1, toughness: 1 });
  });

  cardTest('Bumi, Eclectic Earthbender', () => {
    let { s, ids } = board({ p1: ['Bumi, Eclectic Earthbender', 'Forest'] });
    s = structuredClone(s);
    // Earthbend 1 by hand, as if Bumi had entered: then attack.
    s.effects.push({ effect: { affects: 'self', addTypes: ['Creature'], setBase: [0, 0], addKeywords: ['haste'], earthbent: true }, affected: [ids.p1[1]!], timestamp: s.nextTimestamp++, duration: 'permanent', controller: 'p1', source: ids.p1[0]! });
    s.objects[ids.p1[1]!]!.counters['+1/+1'] = 1;
    s = settle(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }));
    expect(chars(s, ids.p1[1]!).power).toBe(3);
  });

  cardTest('Toph, the Blind Bandit', () => {
    const { s, ids } = board({ p1: lands(3, 'Forest'), hand1: ['Toph, the Blind Bandit'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = settle(act(after, { kind: 'targets', targets: [[ids.p1[0]!]] }));
    expect(chars(after, named(after, 'Toph, the Blind Bandit')[0]!)).toMatchObject({ power: 2, toughness: 3 });
  });

  cardTest('Suki, Kyoshi Warrior', () => {
    let { s, ids } = board({ p1: ['Suki, Kyoshi Warrior', 'Capital Guard'] });
    expect(chars(s, ids.p1[0]!).power).toBe(2);
    s = settle(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }));
    const token = named(s, 'Ally')[0]!;
    expect(s.objects[token]).toMatchObject({ tapped: true, attacking: 'p2' });
    expect(chars(s, ids.p1[0]!).power).toBe(3);
    s = passUntil(s, (x) => x.step === 'main2');
    expect(lifeOf(s, 'p2')).toBe(16); // 3 from Suki, 1 from the token
  });

  cardTest('Rebellious Captives', () => {
    const { s, ids } = board({ p1: ['Rebellious Captives', ...lands(7, 'Forest')] });
    const after = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p1[7]!]] })));
    expect(chars(after, ids.p1[0]!).power).toBe(4);
    expect(chars(after, ids.p1[7]!)).toMatchObject({ power: 2, toughness: 2 });
  });

  cardTest('Flexible Waterbender', () => {
    // Waterbend {3}: two lands and a creature tapped.
    const { s, ids } = board({ p1: ['Flexible Waterbender', 'Capital Guard', 'Island', 'Island'] });
    const after = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    expect(chars(after, ids.p1[0]!)).toMatchObject({ power: 5, toughness: 2 });
    expect(after.objects[ids.p1[1]!]!.tapped).toBe(true);
  });

  cardTest('Geyser Leaper', () => {
    const { s, ids } = board({ p1: ['Geyser Leaper', ...lands(4, 'Island')] });
    let after = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    after = passUntil(after, (x) => x.decision?.kind === 'pick');
    expect(after.decision).toMatchObject({ kind: 'pick', min: 1, max: 1 });
  });

  cardTest('Katara, Bending Prodigy', () => {
    let { s, ids } = board({ p1: ['Katara, Bending Prodigy'] });
    s = structuredClone(s); s.objects[ids.p1[0]!]!.tapped = true;
    s = passUntil(s, (x) => x.turn === 2);
    expect(s.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
    const draw = board({ p1: ['Katara, Bending Prodigy', ...lands(6, 'Island')] });
    const hand = draw.s.zones['p1.hand'].length;
    expect(passBoth(act(draw.s, { kind: 'activate', object: draw.ids.p1[0]!, ability: 0 })).zones['p1.hand']).toHaveLength(hand + 1);
  });

  cardTest('Water Whip', () => {
    const { s, ids } = board({ p1: lands(7, 'Island'), p2: ['Komodo Rhino', 'Gilacorn'], hand1: ['Water Whip'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!, ids.p2[1]!]] }));
    expect(after.zones['p2.hand'].length).toBeGreaterThanOrEqual(2);
    expect(named(after, 'Komodo Rhino')).toHaveLength(0);
    const short = board({ p1: lands(6, 'Island'), hand1: ['Water Whip'] });
    expect(refused(short.s, { kind: 'cast', object: short.ids.hand1[0]!, targets: [[]] })).toMatch(/mana/);
  });

  cardTest('Aang, the Last Airbender', () => {
    let { s, ids } = board({ p1: lands(4, 'Plains'), p2: ['Komodo Rhino'], hand1: ['Aang, the Last Airbender'] });
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    s = settle(act(s, { kind: 'targets', targets: [[ids.p2[0]!]] }));
    const exiled = s.zones['p2.exile'][0]!;
    expect(s.objects[exiled]).toMatchObject({ airbended: true });
    expect(s.zones.battlefield).not.toContain(ids.p2[0]);
  });

  cardTest('Airbending Lesson', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), p2: ['Komodo Rhino', 'Mountain', 'Mountain'], hand1: ['Airbending Lesson'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] }));
    expect(named(after, 'Komodo Rhino')).toHaveLength(0);
    const exiled = after.zones['p2.exile'][0]!;
    after = passUntil(after, (x) => x.turn === 2 && x.step === 'main1' && x.decision?.kind === 'priority');
    after = passBoth(act(after, { kind: 'cast', object: exiled })); // {2}, not {3}{R}
    expect(named(after, 'Komodo Rhino')).toHaveLength(1);
  });

  cardTest('Turtle-Duck', () => {
    const { s, ids } = board({ p1: ['Turtle-Duck', ...lands(3)] });
    const after = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    expect(chars(after, ids.p1[0]!)).toMatchObject({ power: 4, toughness: 4, keywords: ['trample'] });
  });

  cardTest('Hog-Monkey', () => {
    let { s, ids } = board({ p1: ['Hog-Monkey', ...lands(5, 'Swamp')] });
    s = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    expect(chars(s, ids.p1[0]!).power).toBe(5);
    s = passUntil(s, (x) => x.step === 'beginCombat' && x.zones.stack.length === 0 && x.decision?.kind === 'priority');
    expect(chars(s, ids.p1[0]!).keywords).toContain('menace');
  });

  cardTest('Fire Nation Sentinels', () => {
    const { s, ids } = board({ p1: ['Fire Nation Sentinels', 'Capital Guard', ...lands(2)], p2: ['Gilacorn'], hand1: ['Lightning Strike'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(chars(after, ids.p1[1]!).power).toBe(3);
    expect(chars(after, ids.p1[0]!).power).toBe(5);
  });
});
