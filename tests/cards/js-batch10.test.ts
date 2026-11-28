/** Jumpstart cards, batch 10: Azula, Bounty Hunter, Hunting, Hei Bai (2) and Alliance packets. */
import { describe, expect } from 'vitest';
import { whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const nameOfCard = (s: GameState, id: ObjectId) => s.setup.cards[s.objects[id]!.card]!.name;
const handNames = (s: GameState, p: 'p1' | 'p2' = 'p1') => s.zones[`${p}.hand`].map((id) => nameOfCard(s, id));
const ordered = (s: GameState) => (s.decision?.kind === 'triggerOrder' ? act(s, { kind: 'order', triggers: s.decision.triggers }) : s);

describe('Jumpstart, batch 10', () => {
  cardTest('Azula, Ruthless Firebender', () => {
    const { s, ids } = board({ p1: ['Azula, Ruthless Firebender', ...lands(3, 'Swamp')], hand1: ['Consider'] });
    let t = passUntil(ordered(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] })), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [ids.hand1[0]!] }));
    expect(t.players.p1.counters.experience).toBe(1);
    t = passUntil(t, (x) => x.step === 'main2' && x.decision?.kind === 'priority');
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 4, keywords: expect.arrayContaining(['menace']) });
  });

  cardTest('Dark Deal', () => {
    const { s, ids } = board({ p1: lands(3, 'Swamp'), hand1: ['Dark Deal', 'Consider', 'Consider'] });
    const p2hand = s.zones['p2.hand'].length;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(t.zones['p1.hand']).toHaveLength(s.zones['p1.hand'].length - 2); // all but Dark Deal, discarded, then that many minus one
    expect(t.zones['p2.hand']).toHaveLength(p2hand - 1);
  });

  cardTest('Lo and Li, Twin Tutors', () => {
    const { s, ids } = board({ p1: lands(5, 'Swamp'), hand1: ['Lo and Li, Twin Tutors', 'Octopus Form'], library1: ['Origin of Metalbending'], p2: ['Capital Guard'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ options: [ids.library1[0]] });
    t = settle(act(t, { kind: 'pick', cards: [ids.library1[0]!] }));
    expect(handNames(t)).toContain('Origin of Metalbending');
  });

  cardTest('Bastion of Remembrance', () => {
    const { s, ids } = board({ p1: lands(8, 'Swamp'), hand1: ['Bastion of Remembrance', 'Deadly Precision'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const soldier = named(t, 'Human Soldier')[0]!;
    t = settle(passBoth(act(t, { kind: 'cast', object: ids.hand1[1]!, cost: 0, targets: [[soldier]] })));
    expect([lifeOf(t, 'p1'), lifeOf(t, 'p2')]).toEqual([21, 19]);
  });

  cardTest('June, Bounty Hunter', () => {
    const { s, ids } = board({ p1: ['June, Bounty Hunter', 'Capital Guard', 'Swamp'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(named(t, 'Clue')).toHaveLength(1);
    expect(named(t, 'Capital Guard')).toHaveLength(0);
  });

  cardTest('Nyla, Shirshu Sleuth', () => {
    const { s, ids } = board({ p1: lands(5, 'Swamp'), graveyard1: ['Komodo Rhino'], hand1: ['Nyla, Shirshu Sleuth'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[ids.graveyard1[0]!]] })));
    expect(lifeOf(t, 'p1')).toBe(16);
    expect(named(t, 'Clue')).toHaveLength(4);
    const exiled = t.zones['p1.exile'][0]!;
    expect(t.objects[exiled]!.exiledWith).toBe(named(t, 'Nyla, Shirshu Sleuth')[0]);
  });

  cardTest('Obsessive Pursuit', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', 'Food', ...lands(4, 'Swamp')], hand1: ['Obsessive Pursuit'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect([lifeOf(t, 'p1'), named(t, 'Clue').length]).toEqual([19, 1]);
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[1]!, ability: 0 }))); // sacrifice the Food
    t = settle(passBoth(act(toAttack(t), { kind: 'attack', attackers: [ids.p1[0]!] })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Giant Fly', () => {
    const { s, ids } = board({ p1: ['Giant Fly', 'Food', ...lands(2)] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).power).toBe(3);
  });

  cardTest("Zuko's Conviction", () => {
    const { s, ids } = board({ p1: lands(5, 'Swamp'), graveyard1: ['Komodo Rhino'], hand1: ["Zuko's Conviction"] });
    const plain = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.graveyard1[0]!]] })));
    expect(handNames(plain)).toContain('Komodo Rhino');
    const kicked = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 1, targets: [[ids.graveyard1[0]!]] })));
    expect(named(kicked, 'Komodo Rhino').map((id) => kicked.objects[id]!.tapped)).toEqual([true]);
  });

  cardTest('Desperate Plea', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(2, 'Swamp')], p2: ['Capital Guard'], graveyard1: ['Callous Inspector'], hand1: ['Desperate Plea'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0, 1], targets: [[ids.graveyard1[0]!], [ids.p2[0]!]] })));
    expect(named(t, 'Callous Inspector')).toHaveLength(1); // power 1 ≤ the Rhino's 5
    expect(named(t, 'Capital Guard')).toHaveLength(0);
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest('Diresight', () => {
    const { s, ids } = board({ p1: lands(3, 'Swamp'), hand1: ['Diresight'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('arrange'));
    t = settle(act(t, { kind: 'arrange', top: (t.decision as { cards: ObjectId[] }).cards, away: [] }));
    expect(lifeOf(t, 'p1')).toBe(18);
    expect(t.zones['p1.hand']).toHaveLength(s.zones['p1.hand'].length + 1);
  });

  cardTest('Foggy Swamp Hunters', () => {
    const { s, ids } = board({ p1: ['Foggy Swamp Hunters', 'Clue', 'Clue', ...lands(4)] });
    let t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).keywords).not.toContain('lifelink');
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[2]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).keywords).toEqual(expect.arrayContaining(['lifelink', 'menace']));
  });

  cardTest('Raven Eagle', () => {
    const { s, ids } = board({ p1: lands(3, 'Swamp'), graveyard1: ['Komodo Rhino'], hand1: ['Raven Eagle'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[ids.graveyard1[0]!]] })));
    expect(t.zones['p1.exile']).toHaveLength(1);
    expect(named(t, 'Clue')).toHaveLength(1);
  });

  cardTest('Swampsnare Trap', () => {
    const { s, ids } = board({ p1: lands(2, 'Swamp'), p2: ['Raven Eagle', 'Komodo Rhino'], hand1: ['Swampsnare Trap'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!, [[ids.p2[0]!]])).toBeNull(); // {1}{B} for a flier
    expect(whyNotCast(s, 'p1', ids.hand1[0]!, [[ids.p2[1]!]])).toMatch(/mana/);
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(named(t, 'Raven Eagle')).toHaveLength(0); // 2/3 gets -5/-3
  });

  cardTest('Curious Farm Animals', () => {
    const { s, ids } = board({ p1: ['Curious Farm Animals', ...lands(2, 'Plains')], p2: ['Bison Whistle'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p2[0]!]] })));
    expect(named(t, 'Bison Whistle')).toHaveLength(0);
    expect(lifeOf(t, 'p1')).toBe(23);
  });

  cardTest('Destined Confrontation', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', 'Capital Guard', ...lands(4, 'Plains')], p2: ['Komodo Rhino', 'Callous Inspector'], hand1: ['Destined Confrontation'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ player: 'p1', maxPower: 4 });
    expect(refused(t, { kind: 'pick', cards: [ids.p1[0]!] })).toMatch(/power 4/);
    t = passUntil(act(t, { kind: 'pick', cards: [ids.p1[1]!] }), decisionIs('pick'));
    expect(t.decision).toMatchObject({ player: 'p2' });
    t = settle(act(t, { kind: 'pick', cards: [ids.p2[1]!] }));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
    expect(named(t, 'Capital Guard')).toHaveLength(1);
    expect(named(t, 'Callous Inspector')).toHaveLength(1);
  });

  cardTest("Sokka's Sword Training", () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2, 'Plains')], hand1: ["Sokka's Sword Training"] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(chars(t, ids.p1[0]!).power).toBe(4);
    expect(named(t, 'Clue')).toHaveLength(1);
  });

  cardTest('Suki, Courageous Rescuer', () => {
    const { s, ids } = board({ p1: ['Suki, Courageous Rescuer', 'Capital Guard', 'Food', 'Food', ...lands(4)] });
    expect(chars(s, ids.p1[1]!).power).toBe(3);
    let t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[2]!, ability: 0 }))); // a Food leaves
    expect(named(t, 'Ally')).toHaveLength(1);
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[3]!, ability: 0 })));
    expect(named(t, 'Ally')).toHaveLength(1); // only once each turn
  });

  cardTest("That's Rough Buddy", () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Callous Inspector', ...lands(5, 'Swamp'), 'Plains', 'Plains'], hand1: ["That's Rough Buddy", 'Deadly Precision'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[1]!, cost: 0, targets: [[ids.p1[1]!]] })));
    t = settle(passBoth(act(t, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(2); // a creature left this turn
  });

  cardTest('Fancy Footwork', () => {
    let { s, ids } = board({ p1: ['Capital Guard', 'Komodo Rhino', ...lands(3, 'Plains')], hand1: ['Fancy Footwork'] });
    s = structuredClone(s);
    s.objects[ids.p1[0]!]!.tapped = true;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!, ids.p1[1]!]] })));
    expect(t.objects[ids.p1[0]!]!.tapped).toBe(false);
    expect(chars(t, ids.p1[1]!).power).toBe(7);
  });

  cardTest('Jet, Freedom Fighter', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(5)], p2: ['Komodo Rhino'], hand1: ['Jet, Freedom Fighter'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0); // 2 damage: the Guard and Jet
  });

  cardTest('Kyoshi Warriors', () => {
    const { s, ids } = board({ p1: lands(4, 'Plains'), hand1: ['Kyoshi Warriors'] });
    expect(named(settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }))), 'Ally')).toHaveLength(1);
  });

  cardTest('South Pole Voyager', () => {
    const { s, ids } = board({ p1: lands(6, 'Plains'), hand1: ['South Pole Voyager', 'Kyoshi Warriors'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(lifeOf(t, 'p1')).toBe(21);
    const hand = t.zones['p1.hand'].length;
    t = settle(ordered(passBoth(act(t, { kind: 'cast', object: ids.hand1[1]! }))));
    expect(lifeOf(t, 'p1')).toBe(23); // the Warriors and their Ally token
    expect(t.zones['p1.hand']).toHaveLength(hand); // the Warriors cast, one card drawn on the second resolution
  });

  cardTest('The Duke, Rebel Sentry', () => {
    const { s, ids } = board({ p1: ['Plains', 'Capital Guard'], hand1: ['The Duke, Rebel Sentry'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const duke = named(t, 'The Duke, Rebel Sentry')[0]!;
    expect(t.objects[duke]!.counters['+1/+1']).toBe(1);
    t = structuredClone(t);
    t.objects[duke]!.controlledSince = -1;
    t = settle(passBoth(act(t, { kind: 'activate', object: duke, ability: 0, targets: [[ids.p1[1]!]] })));
    expect(t.objects[duke]!.counters['+1/+1']).toBe(0);
    expect(chars(t, ids.p1[1]!).keywords).toContain('hexproof');
  });

  cardTest('Acrobatic Leap', () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Plains'], hand1: ['Acrobatic Leap'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 3, toughness: 5, keywords: expect.arrayContaining(['flying']) });
  });

  cardTest('Inspired Insurgent', () => {
    const { s, ids } = board({ p1: ['Inspired Insurgent', 'Plains'], p2: ['Bison Whistle'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p2[0]!]] })));
    expect(named(t, 'Bison Whistle')).toHaveLength(0);
  });

  cardTest('Jet, Rebel Leader', () => {
    const { s, ids } = board({ p1: ['Jet, Rebel Leader'], library1: ['Capital Guard', 'Komodo Rhino'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), decisionIs('pick'));
    expect(t.decision).toMatchObject({ options: [ids.library1[0]] }); // mana value 3 or less
    t = act(t, { kind: 'pick', cards: [ids.library1[0]!] });
    const guard = named(t, 'Capital Guard')[0]!;
    expect(t.objects[guard]).toMatchObject({ tapped: true, attacking: 'p2' });
  });
});
