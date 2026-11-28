/** Jumpstart cards, batch 12: Gliding (1), Aang, Rebelling, Firebending, Sparky Sparky and Powerful (2) packets. */
import { describe, expect } from 'vitest';
import { whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const attack = (s: GameState, ...attackers: ObjectId[]) => act(toAttack(s), { kind: 'attack', attackers });
const cast = (s: GameState, object: ObjectId, more: object = {}) => passBoth(act(s, { kind: 'cast', object, ...more }));
const ordered = (s: GameState) => (s.decision?.kind === 'triggerOrder' ? act(s, { kind: 'order', triggers: s.decision.triggers }) : s);
const handSize = (s: GameState) => s.zones['p1.hand'].length;
const yourUpkeep = (s: GameState) => passUntil(s, (x) => x.step === 'upkeep' && x.active === 'p1' && x.turn === 3 && x.zones.stack.length === 0 && x.pendingTriggers.length === 0 && x.decision?.kind === 'priority');

describe('Jumpstart, batch 12', () => {
  cardTest('Kindly Customer', () => {
    const { s, ids } = board({ p1: lands(2, 'Plains'), hand1: ['Kindly Customer'] });
    expect(handSize(settle(cast(s, ids.hand1[0]!)))).toBe(handSize(s));
  });

  cardTest('Aang, Airbending Master', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(5, 'Plains')], hand1: ['Aang, Airbending Master'] });
    const t = settle(cast(s, ids.hand1[0]!));
    expect(t.zones['p1.exile']).toHaveLength(1); // the Guard, airbent
    expect(t.players.p1.counters.experience).toBe(1); // it left without dying
    const u = yourUpkeep(t);
    expect(named(u, 'Ally')).toHaveLength(1);
  });

  cardTest('Cloudshift', () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Plains'], hand1: ['Cloudshift'] });
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] }));
    expect(named(t, 'Capital Guard')).toHaveLength(1);
    expect(t.objects[ids.p1[0]!]).toBeUndefined(); // a new object
  });

  cardTest('Enter the Avatar State', () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Plains'], hand1: ['Enter the Avatar State'] });
    const c = chars(settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] })), ids.p1[0]!);
    expect(c.subtypes).toContain('Avatar');
    expect(c.keywords).toEqual(expect.arrayContaining(['flying', 'first strike', 'lifelink', 'hexproof']));
  });

  cardTest('Freedom Fighter Recruit', () => {
    const { s, ids } = board({ p1: ['Freedom Fighter Recruit', 'Capital Guard'] });
    expect(chars(s, ids.p1[0]!).power).toBe(2);
  });

  cardTest('Treetop Freedom Fighters', () => {
    const { s, ids } = board({ p1: lands(3), hand1: ['Treetop Freedom Fighters'] });
    expect(named(settle(cast(s, ids.hand1[0]!)), 'Ally')).toHaveLength(1);
  });

  cardTest('Longshot, Rebel Bowman', () => {
    const { s, ids } = board({ p1: ['Longshot, Rebel Bowman', 'Mountain'], hand1: ['Cunning Maneuver'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull(); // {1}{R} for {R}
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] }));
    expect(lifeOf(t, 'p2')).toBe(18);
  });

  cardTest('Smellerbee, Rebel Fighter', () => {
    const { s, ids } = board({ p1: ['Smellerbee, Rebel Fighter'], hand1: ['Capital Guard'] });
    expect(chars(s, ids.p1[0]!).keywords).toContain('first strike');
    let t = passUntil(attack(s, ids.p1[0]!), decisionIs('may'));
    t = settle(act(t, { kind: 'yes' }));
    expect(named(t, 'Capital Guard', 'p1.graveyard')).toHaveLength(1);
    expect(handSize(t)).toBe(1); // one attacker
  });

  cardTest('Fire Nation Attacks', () => {
    const { s, ids } = board({ p1: lands(9), graveyard1: ['Fire Nation Attacks'] });
    expect(whyNotCast(s, 'p1', ids.graveyard1[0]!)).toBeNull(); // flashback
    const t = settle(cast(s, ids.graveyard1[0]!));
    expect(named(t, 'Soldier')).toHaveLength(2);
    expect(named(t, 'Fire Nation Attacks', 'p1.exile')).toHaveLength(1);
  });

  cardTest('Cunning Maneuver', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2)], hand1: ['Cunning Maneuver'] });
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] }));
    expect([chars(t, ids.p1[0]!).power, named(t, 'Clue').length]).toEqual([5, 1]);
  });

  cardTest('Bumi Bash', () => {
    const { s, ids } = board({ p1: lands(4), p2: ['Capital Guard'], hand1: ['Bumi Bash'] });
    const t = settle(cast(s, ids.hand1[0]!, { modes: [0], targets: [[ids.p2[0]!]] }));
    expect(named(t, 'Capital Guard', 'p2.graveyard')).toHaveLength(1);
    const basic = board({ p1: lands(4), p2: ['Forest'], hand1: ['Bumi Bash'] });
    expect(whyNotCast(basic.s, 'p1', basic.ids.hand1[0]!)).toBe('No legal target'); // a basic land isn't
  });

  cardTest('Overwhelming Victory', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(5)], p2: ['Capital Guard'], hand1: ['Overwhelming Victory'] });
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p2[0]!]] }));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 5, keywords: expect.arrayContaining(['trample']) }); // excess 3
  });

  cardTest('Fire Nation Cadets', () => {
    const { s, ids } = board({ p1: ['Fire Nation Cadets', ...lands(2)], graveyard1: ['Firebending Lesson'] });
    let t = attack(s, ids.p1[0]!);
    t = passUntil(t, (x) => x.players.p1.combatPool.R > 0 || x.step === 'blockers');
    expect(t.players.p1.combatPool.R).toBe(2);
    const none = board({ p1: ['Fire Nation Cadets', ...lands(2)] });
    const u = settle(passBoth(act(none.s, { kind: 'activate', object: none.ids.p1[0]!, ability: 0 })));
    expect(chars(u, none.ids.p1[0]!).power).toBe(2);
  });

  cardTest('Firebender Ascension', () => {
    const { s, ids } = board({ p1: ['Firebender Ascension', 'Fire Nation Cadets'], graveyard1: ['Firebending Lesson'] });
    s.objects[ids.p1[0]!]!.counters.quest = 3;
    let t = passUntil(ordered(passUntil(attack(s, ids.p1[1]!), decisionIs('triggerOrder'))), decisionIs('may'));
    t = passUntil(act(t, { kind: 'yes' }), (x) => x.zones.stack.length === 0 && x.pendingTriggers.length === 0);
    expect(t.objects[ids.p1[0]!]!.counters.quest).toBe(4);
    expect(t.players.p1.combatPool.R).toBe(4); // firebending 2, twice
  });

  cardTest('Jeong Jeong, the Deserter', () => {
    const { s, ids } = board({ p1: ['Jeong Jeong, the Deserter', ...lands(4)], p2: ['Capital Guard', 'Capital Guard'], hand1: ['Firebending Lesson'] });
    let t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
    t = settle(cast(t, ids.hand1[0]!, { cost: 0, targets: [[ids.p2[0]!]] }));
    expect(named(t, 'Capital Guard', 'p2.graveyard')).toHaveLength(1);
    expect(t.players.p2.life).toBe(20);
    expect(named(t, 'Firebending Lesson', 'p1.graveyard')).toHaveLength(1); // the copy ceased to exist
  });

  cardTest('Firebending Lesson', () => {
    const { s, ids } = board({ p1: lands(5), p2: ['Treetop Freedom Fighters', 'Komodo Rhino'], hand1: ['Firebending Lesson'] });
    const t = settle(cast(s, ids.hand1[0]!, { cost: 1, targets: [[ids.p2[1]!]] }));
    expect(named(t, 'Komodo Rhino', 'p2.graveyard')).toHaveLength(1);
  });

  cardTest('Reckless Blaze', () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Capital Guard', ...lands(5)], p2: ['Komodo Rhino'], hand1: ['Reckless Blaze'] });
    const t = passUntil(ordered(passUntil(cast(s, ids.hand1[0]!), decisionIs('triggerOrder'))), (x) => x.zones.stack.length === 0 && x.pendingTriggers.length === 0);
    expect(named(t, 'Komodo Rhino', 'p2.graveyard')).toHaveLength(1);
    expect(t.players.p1.pool.R).toBe(2);
  });

  cardTest('Moku, Meandering Drummer', () => {
    const { s, ids } = board({ p1: ['Moku, Meandering Drummer', ...lands(3)], hand1: ['Cunning Maneuver'] });
    let t = passUntil(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] }), decisionIs('payOrElse'));
    expect(t.decision).toMatchObject({ reward: expect.stringContaining('haste') });
    t = settle(act(t, { kind: 'yes' }));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 7, toughness: 4, keywords: expect.arrayContaining(['haste']) });
  });

  cardTest('Combustion Technique', () => {
    const { s, ids } = board({ p1: lands(2), p2: ['Capital Guard'], graveyard1: ['Firebending Lesson'], hand1: ['Combustion Technique'] });
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p2[0]!]] }));
    expect(named(t, 'Capital Guard', 'p2.exile')).toHaveLength(1);
  });

  cardTest('War Balloon', () => {
    const { s, ids } = board({ p1: ['War Balloon', ...lands(3)] });
    expect(chars(s, ids.p1[0]!).types).not.toContain('Creature');
    let t = s;
    for (let i = 0; i < 3; i++) t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ types: expect.arrayContaining(['Creature']), keywords: expect.arrayContaining(['flying']) });
  });

  cardTest('Combustion Man', () => {
    const { s, ids } = board({ p1: ['Combustion Man'], p2: ['Capital Guard'] });
    let t = passUntil(attack(s, ids.p1[0]!), decisionIs('triggerTargets'));
    t = passUntil(act(t, { kind: 'targets', targets: [[ids.p2[0]!]] }), decisionIs('may'));
    expect(t.decision).toMatchObject({ player: 'p2' });
    const kept = settle(act(t, { kind: 'yes' }));
    expect([lifeOf(kept, 'p2'), named(kept, 'Capital Guard').length]).toEqual([16, 1]);
    const lost = settle(act(t, { kind: 'no' }));
    expect(named(lost, 'Capital Guard', 'p2.graveyard')).toHaveLength(1);
  });

  cardTest('Ran and Shaw', () => {
    const { s, ids } = board({ p1: lands(5), graveyard1: ['Firebending Lesson', 'Firebending Lesson', "Fang, Roku's Companion"], hand1: ['Ran and Shaw'] });
    const t = settle(cast(s, ids.hand1[0]!));
    expect(named(t, 'Ran and Shaw')).toHaveLength(2); // the copy isn't legendary
    expect(t.decision?.kind).toBe('priority');
  });

  cardTest("Iroh's Demonstration", () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2)], p2: ['Kindly Customer', 'Capital Guard'], hand1: ["Iroh's Demonstration"] });
    const t = settle(cast(s, ids.hand1[0]!, { modes: [0] }));
    expect(named(t, 'Kindly Customer', 'p2.graveyard')).toHaveLength(1);
    expect(t.objects[ids.p1[0]!]!.damage).toBe(0);
  });

  cardTest('Price of Freedom', () => {
    const { s, ids } = board({ p1: lands(2), p2: ['Forest'], hand1: ['Price of Freedom'] });
    let t = passUntil(cast(s, ids.hand1[0]!, { targets: [[ids.p2[0]!]] }), decisionIs('may'));
    expect(t.decision).toMatchObject({ player: 'p2' });
    t = passUntil(act(t, { kind: 'yes' }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[0]!] }));
    expect(named(t, 'Forest')).toHaveLength(1);
    expect(handSize(t)).toBe(handSize(s));
  });

  cardTest('Tiger-Dillo', () => {
    const { s, ids } = board({ p1: ['Tiger-Dillo'] });
    expect(chars(s, ids.p1[0]!).keywords).toContain("can't attack or block");
    const big = board({ p1: ['Tiger-Dillo', 'Komodo Rhino'] });
    expect(chars(big.s, big.ids.p1[0]!).keywords).not.toContain("can't attack or block");
  });

  cardTest('Fire Nation Raider', () => {
    const { s, ids } = board({ p1: lands(4), hand1: ['Fire Nation Raider'] });
    expect(named(settle(cast(s, ids.hand1[0]!)), 'Clue')).toHaveLength(0);
  });

  cardTest("Fang, Roku's Companion", () => {
    const { s, ids } = board({ p1: ["Fang, Roku's Companion", 'Jeong Jeong, the Deserter', ...lands(1)], p2: [], hand1: ['Firebending Lesson'] });
    const t = passUntil(attack(s, ids.p1[0]!), (x) => x.zones.stack.length === 0 && x.pendingTriggers.length === 0); // the only legal target
    expect(chars(t, ids.p1[1]!).power).toBe(6);
    // Dies: back as a Spirit; dies again: stays.
    const d = board({ p1: ["Fang, Roku's Companion", ...lands(10)], hand1: ['Overwhelming Victory', 'Overwhelming Victory'] });
    let u = settle(cast(d.s, d.ids.hand1[0]!, { targets: [[d.ids.p1[0]!]] }));
    const fang = named(u, "Fang, Roku's Companion")[0]!;
    expect(chars(u, fang).subtypes).toContain('Spirit');
    u = settle(cast(u, d.ids.hand1[1]!, { targets: [[fang]] }));
    expect(named(u, "Fang, Roku's Companion", 'p1.graveyard')).toHaveLength(1);
  });

  cardTest('Cathartic Reunion', () => {
    const { s, ids } = board({ p1: lands(2), hand1: ['Cathartic Reunion', 'Capital Guard', 'Kindly Customer'] });
    const t = settle(cast(s, ids.hand1[0]!, { discarding: [ids.hand1[1]!, ids.hand1[2]!] }));
    expect(handSize(t)).toBe(handSize(s));
    expect(t.zones['p1.graveyard']).toHaveLength(3);
  });
});
