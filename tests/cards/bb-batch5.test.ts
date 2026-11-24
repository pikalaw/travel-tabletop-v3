/** Beginner Box cards, batch 5: Auras and Equipment, last-known counters, looking at the top, hand reveals, playing from exile, cost conversions. */
import { describe, expect } from 'vitest';
import type { GameState } from '../../src/engine/types';
import { act, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');

describe('Beginner Box, batch 5', () => {
  cardTest('Path to Redemption', () => {
    const { s, ids } = board({ p1: lands(7, 'Plains'), p2: ['Capital Guard'], hand1: ['Path to Redemption'] });
    const guard = ids.p2[0]!;
    let after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[guard]] })));
    const aura = named(after, 'Path to Redemption')[0]!;
    expect(after.objects[aura]!.attachedTo).toBe(guard);
    expect(chars(after, guard).keywords).toContain("can't attack or block");
    after = settle(passBoth(act(after, { kind: 'activate', object: aura, ability: 0 })));
    expect(named(after, 'Capital Guard')).toHaveLength(0);
    expect(after.zones['p2.exile']).toHaveLength(1);
    expect(after.zones['p1.graveyard']).toHaveLength(1);
    expect(named(after, 'Ally')).toHaveLength(1);
  });

  cardTest('Seismic Tutelage', () => {
    let { s, ids } = board({ p1: ['Komodo Rhino', ...lands(4, 'Forest')], hand1: ['Seismic Tutelage'] });
    const rhino = ids.p1[0]!;
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[rhino]] })));
    expect(s.objects[rhino]!.counters['+1/+1']).toBe(1);
    s = settle(passBoth(act(toAttack(s), { kind: 'attack', attackers: [rhino] })));
    expect(s.objects[rhino]!.counters['+1/+1']).toBe(2);
  });

  cardTest('Watery Grasp', () => {
    let { s, ids } = board({ p1: ['Capital Guard', 'Komodo Rhino', 'Island', ...lands(3, 'Island')], p2: ['Warship Scout'], hand1: ['Watery Grasp'] });
    const scout = ids.p2[0]!;
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[scout]] })));
    expect(chars(s, scout).keywords).toContain("doesn't untap");
    s.objects[scout]!.tapped = true;
    s = passUntil(s, (x) => x.turn === 2 && x.step === 'main1');
    expect(s.objects[scout]!.tapped).toBe(true);
    s = passUntil(s, (x) => x.turn === 3 && x.step === 'main1' && x.decision?.kind === 'priority');
    const aura = named(s, 'Watery Grasp')[0]!;
    const library = s.zones['p2.library'].length;
    s = settle(passBoth(act(s, { kind: 'activate', object: aura, ability: 0 })));
    expect(named(s, 'Warship Scout')).toHaveLength(0);
    expect(s.zones['p2.library']).toHaveLength(library + 1);
    expect(named(s, 'Watery Grasp')).toHaveLength(0); // 704.5m
    expect(s.zones['p1.graveyard']).toHaveLength(1);
  });

  cardTest('Mechanical Glider', () => {
    let { s, ids } = board({ p1: ['Capital Guard', 'Komodo Rhino', ...lands(3)], hand1: ['Mechanical Glider'] });
    const [guard, rhino] = [ids.p1[0]!, ids.p1[1]!];
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    s = settle(act(passUntil(s, (x) => x.decision?.kind === 'triggerTargets'), { kind: 'targets', targets: [[guard]] }));
    expect(chars(s, guard).keywords).toContain('flying');
    const glider = named(s, 'Mechanical Glider')[0]!;
    s = settle(passBoth(act(s, { kind: 'activate', object: glider, ability: 0, targets: [[rhino]] })));
    expect(chars(s, guard).keywords).not.toContain('flying');
    expect(chars(s, rhino).keywords).toContain('flying');
    expect(refused(passBoth(s), { kind: 'activate', object: glider, ability: 0, targets: [[guard]] })).toBeTruthy();
  });

  cardTest('Razor Rings', () => {
    let { s, ids } = board({ p1: ['Capital Guard', ...lands(2, 'Plains')], p2: ['Warship Scout'], hand1: ['Razor Rings'] });
    const life = lifeOf(s, 'p1');
    const toughness = chars(s, ids.p1[0]!).toughness;
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] });
    s = passBoth(s);
    expect(named(s, 'Capital Guard')).toHaveLength(0);
    expect(lifeOf(s, 'p1') - life).toBe(4 - toughness); // the excess over lethal
  });

  cardTest('Master Piandao', () => {
    let { s, ids } = board({ p1: ['Master Piandao'], library1: ['Forest', 'Airbending Lesson', 'Forest', 'Avatar Enthusiasts'] });
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = passBoth(s);
    expect(s.decision).toMatchObject({ kind: 'pick', from: ids.library1, options: [ids.library1[1], ids.library1[3]], min: 0, max: 1 });
    const library = s.zones['p1.library'].length;
    s = act(s, { kind: 'pick', cards: [ids.library1[1]!] });
    expect(named(s, 'Airbending Lesson', 'p1.hand')).toHaveLength(1);
    expect(s.zones['p1.library']).toHaveLength(library - 1);
    // The rest go to the bottom: the top is now what was fifth.
    const names = s.zones['p1.library'].slice(0, 3).map((id) => s.setup.cards[s.objects[id]!.card]!.name).sort();
    expect(names).toEqual(['Avatar Enthusiasts', 'Forest', 'Forest']);
  });

  cardTest('Ostrich-Horse', () => {
    const { s, ids } = board({ p1: lands(3, 'Forest'), hand1: ['Ostrich-Horse'], library1: ['Capital Guard', 'Forest', 'Capital Guard'] });
    let after = passBoth(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(after.decision).toMatchObject({ kind: 'pick', min: 0, max: 1 });
    expect(after.zones['p1.graveyard']).toHaveLength(3);
    const [land] = (after.decision as { options: string[] }).options;
    const took = settle(act(after, { kind: 'pick', cards: [land!] }));
    expect(took.zones['p1.graveyard']).toHaveLength(2);
    expect(took.objects[named(took, 'Ostrich-Horse')[0]!]!.counters['+1/+1']).toBeUndefined();
    after = settle(act(after, { kind: 'pick', cards: [] }));
    expect(after.objects[named(after, 'Ostrich-Horse')[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Hei Bai, Spirit of Balance', () => {
    let { s, ids } = board({ p1: ['Capital Guard', 'Komodo Rhino', ...lands(4, 'Plains')], hand1: ['Hei Bai, Spirit of Balance'] });
    s = passBoth(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(s.decision).toMatchObject({ kind: 'optionalCost', pay: 'sacrifice', options: [ids.p1[0], ids.p1[1]] });
    s = settle(act(s, { kind: 'optionalCost', objects: [ids.p1[0]!] }));
    const hei = named(s, 'Hei Bai, Spirit of Balance')[0]!;
    expect(s.objects[hei]!.counters['+1/+1']).toBe(2);
    // It leaves: its counters go to the creature left.
    s.objects[hei]!.damage = 10;
    s = settle(act(s, { kind: 'pass' }));
    expect(named(s, 'Hei Bai, Spirit of Balance')).toHaveLength(0);
    expect(s.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(2);
  });

  cardTest('Buzzard-Wasp Colony', () => {
    let { s, ids } = board({ p1: ['Capital Guard', 'Komodo Rhino', ...lands(4, 'Swamp')], hand1: ['Buzzard-Wasp Colony', 'Lightning Strike'] });
    s.objects[ids.p1[1]!]!.counters['+1/+1'] = 2;
    const hand = s.zones['p1.hand'].length;
    s = passBoth(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    s = settle(act(s, { kind: 'optionalCost', objects: [ids.p1[1]!] }));
    expect(s.zones['p1.hand']).toHaveLength(hand - 1 + 1);
    const colony = named(s, 'Buzzard-Wasp Colony')[0]!;
    expect(s.objects[colony]!.counters['+1/+1']).toBe(2); // the Rhino died with two counters
  });

  cardTest('Purple Pentapus', () => {
    // Surveil 1 moves the top card itself, and only it.
    const cast = board({ p1: lands(1, 'Swamp'), hand1: ['Purple Pentapus'], library1: ['Capital Guard'] });
    const library = cast.s.zones['p1.library'].length;
    let entered = passUntil(passBoth(act(cast.s, { kind: 'cast', object: cast.ids.hand1[0]! })), (x) => x.decision?.kind === 'arrange');
    expect(entered.decision).toMatchObject({ cards: cast.ids.library1 });
    entered = settle(act(entered, { kind: 'arrange', top: [], away: cast.ids.library1 }));
    expect(named(entered, 'Capital Guard', 'p1.graveyard')).toHaveLength(1);
    expect(entered.zones['p1.library']).toHaveLength(library - 1);

    let { s, ids } = board({ p1: ['Capital Guard', ...lands(3, 'Swamp')], graveyard1: ['Purple Pentapus'] });
    const pentapus = ids.graveyard1[0]!;
    expect(refused(s, { kind: 'activate', object: pentapus, ability: 0, tapping: [ids.p1[1]!] })).toMatch(/untapped creature/);
    s = passBoth(act(s, { kind: 'activate', object: pentapus, ability: 0 }));
    expect(s.objects[ids.p1[0]!]!.tapped).toBe(true);
    s = passUntil(s, (x) => x.decision?.kind === 'arrange'); // it enters: surveil 1
    s = settle(act(s, { kind: 'arrange', top: (s.decision as { cards: string[] }).cards, away: [] }));
    const back = named(s, 'Purple Pentapus')[0]!;
    expect(s.objects[back]!.tapped).toBe(true);
  });

  cardTest('Zuko, Exiled Prince', () => {
    let { s, ids } = board({ p1: ['Zuko, Exiled Prince', ...lands(3)], library1: ['Forest'] });
    s = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    const exiled = s.zones['p1.exile'][0]!;
    expect(s.objects[exiled]!.playableTurn).toBe(1);
    s = act(s, { kind: 'play', object: exiled });
    expect(named(s, 'Forest')).toHaveLength(1);
  });

  cardTest('Barrels of Blasting Jelly', () => {
    // {1}: any colour, once a turn: two Mountains pay for a {1}{W} Aura.
    const { s, ids } = board({ p1: ['Barrels of Blasting Jelly', ...lands(2)], p2: ['Komodo Rhino'], hand1: ['Path to Redemption'] });
    const cast = act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] });
    expect(cast.zones.battlefield.filter((id) => cast.objects[id]!.tapped)).toHaveLength(2);
    expect(cast.activatedThisTurn[`${ids.p1[0]}:0`]).toBe(1);
    const fresh = board({ p1: ['Barrels of Blasting Jelly', ...lands(7)], p2: ['Komodo Rhino'] });
    const after = settle(passBoth(act(fresh.s, { kind: 'activate', object: fresh.ids.p1[0]!, ability: 1, targets: [[fresh.ids.p2[0]!]] })));
    expect(named(after, 'Komodo Rhino')).toHaveLength(0);
    expect(named(after, 'Barrels of Blasting Jelly')).toHaveLength(0);
  });

  cardTest('Waterbending Lesson', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(6, 'Island')], hand1: ['Waterbending Lesson'] });
    const hand = s.zones['p1.hand'].length;
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    expect(after.decision).toMatchObject({ kind: 'payOrElse', waterbend: 2 });
    const paid = settle(act(after, { kind: 'yes' }));
    expect(paid.zones['p1.hand']).toHaveLength(hand - 1 + 3);
    const no = act(after, { kind: 'no' });
    expect(no.decision?.kind).toBe('discardEffect');
  });

  cardTest('Dai Li Indoctrination', () => {
    const { s, ids } = board({ p1: lands(2, 'Swamp'), hand1: ['Dai Li Indoctrination'], hand2: ['Capital Guard', 'Lightning Strike'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0], targets: [['p2']] }));
    expect(after.decision).toMatchObject({ kind: 'pick', player: 'p1', options: [ids.hand2[0]], min: 1, max: 1 });
    expect(refused(after, { kind: 'pick', cards: [] })).toBeTruthy();
    after = settle(act(after, { kind: 'pick', cards: [ids.hand2[0]!] }));
    expect(named(after, 'Capital Guard', 'p2.graveyard')).toHaveLength(1);
  });
});
