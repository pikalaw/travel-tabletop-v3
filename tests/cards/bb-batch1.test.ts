/** Beginner Box cards, batch 1: those the M2 vocabulary covers. */
import { describe, expect } from 'vitest';
import { act, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: Parameters<typeof passUntil>[0]) => passUntil(s, (x) => x.decision?.kind === 'attackers');

describe('Beginner Box, batch 1', () => {
  cardTest('Lightning Strike', () => {
    const { s, ids } = board({ p1: lands(2), hand1: ['Lightning Strike'] });
    expect(lifeOf(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] })), 'p2')).toBe(17);
  });

  cardTest('Explosive Shot', () => {
    const { s, ids } = board({ p1: lands(2), p2: ['Komodo Rhino'], hand1: ['Explosive Shot'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] })).toMatch(/legal target/);
    expect(named(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })), 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest("Zuko's Offense", () => {
    const { s, ids } = board({ p1: lands(1), hand1: ["Zuko's Offense"] });
    expect(lifeOf(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] })), 'p2')).toBe(18);
  });

  cardTest('Epic Downfall', () => {
    const { s, ids } = board({ p1: lands(2, 'Swamp'), p2: ['Komodo Rhino', 'Gilacorn'], hand1: ['Epic Downfall'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[1]!]] })).toMatch(/legal target/); // mana value 1
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] }));
    expect(after.zones['p2.exile']).toHaveLength(1);
  });

  cardTest('Run Amok', () => {
    let { s, ids } = board({ p1: ['Capital Guard', ...lands(2)], hand1: ['Run Amok'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })).toMatch(/legal target/); // not attacking
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] }));
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 5, toughness: 5, keywords: ['trample'] });
  });

  cardTest('Pillar Launch', () => {
    let { s, ids } = board({ p1: ['Capital Guard', 'Forest'], hand1: ['Pillar Launch'] });
    s = structuredClone(s); s.objects[ids.p1[0]!]!.tapped = true;
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] }));
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 4, toughness: 4, keywords: ['reach'] });
    expect(s.objects[ids.p1[0]!]!.tapped).toBe(false);
  });

  cardTest("Aang's Defense", () => {
    // Claire attacks on her turn; Lawrence blocks and casts it on his blocker.
    let { s, ids } = board({ p1: ['Kyoshi Warrior Guard', 'Plains'], p2: ['Komodo Rhino'], hand1: ["Aang's Defense"] });
    s = passUntil(s, (x) => x.turn === 2 && x.decision?.kind === 'attackers');
    s = act(s, { kind: 'attack', attackers: [ids.p2[0]!] });
    s = act(passUntil(s, (x) => x.decision?.kind === 'blockers'), { kind: 'block', blocks: [{ blocker: ids.p1[0]!, attacker: ids.p2[0]! }] });
    s = passUntil(s, (x) => x.decision?.kind === 'priority' && x.decision.player === 'p1' && x.step === 'blockers');
    const hand = s.zones['p1.hand'].length;
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] }));
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 4, toughness: 5 });
    expect(s.zones['p1.hand']).toHaveLength(hand); // cast one, drew one
  });

  cardTest('Rocky Rebuke', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(2, 'Forest')], p2: ['Turtle-Seals'], hand1: ['Rocky Rebuke'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!], [ids.p2[0]!]] }));
    expect(named(after, 'Turtle-Seals')).toHaveLength(0);
    expect(after.objects[ids.p1[0]!]!.damage).toBe(0); // one-sided, not a fight
  });

  cardTest("Fire Nation's Conquest", () => {
    const { s, ids } = board({ p1: ["Fire Nation's Conquest", 'Capital Guard'], p2: ['Gilacorn'] });
    expect(chars(s, ids.p1[1]!)).toMatchObject({ power: 3, toughness: 2 });
    expect(chars(s, ids.p2[0]!).power).toBe(1);
  });

  cardTest('Allied Teamwork', () => {
    const { s, ids } = board({ p1: ['Kyoshi Warrior Guard', 'Capital Guard', ...lands(3, 'Plains')], hand1: ['Allied Teamwork'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(after, 'Ally').map((id) => chars(after, id).power)).toEqual([2]); // the token, an Ally, gets +1/+1
    expect(chars(after, ids.p1[0]!).power).toBe(3);  // an Ally
    expect(chars(after, ids.p1[1]!).power).toBe(2);  // not an Ally
  });

  cardTest('Corrupt Court Official', () => {
    const { s, ids } = board({ p1: lands(2, 'Swamp'), hand1: ['Corrupt Court Official'], hand2: ['Gilacorn'] });
    const hand = s.zones['p2.hand'].length;
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = passUntil(after, (x) => x.decision?.kind === 'pick');
    expect(after.decision).toMatchObject({ kind: 'pick', player: 'p2', min: 1, max: 1 }); // Claire chooses
    after = settle(act(after, { kind: 'pick', cards: [ids.hand2[0]!] }));
    expect(after.zones['p2.hand']).toHaveLength(hand - 1);
  });

  cardTest('Pretending Poxbearers', () => {
    const { s, ids } = board({ p1: ['Pretending Poxbearers', ...lands(2)], hand1: ['Lightning Strike'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(named(after, 'Ally')).toHaveLength(1);
  });

  cardTest('Wolf Cove Villager', () => {
    const { s, ids } = board({ p1: ['Plains'], hand1: ['Wolf Cove Villager'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    expect(after.objects[named(after, 'Wolf Cove Villager')[0]!]!.tapped).toBe(true);
  });

  cardTest('Sledding Otter-Penguin', () => {
    const { s, ids } = board({ p1: ['Sledding Otter-Penguin', ...lands(3, 'Plains')] });
    const after = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    expect(chars(after, ids.p1[0]!)).toMatchObject({ power: 3, toughness: 4 });
  });

  cardTest('Fire Nation Archers', () => {
    const { s, ids } = board({ p1: ['Fire Nation Archers', ...lands(5)] });
    const after = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    expect(lifeOf(after, 'p2')).toBe(18);
    expect(named(after, 'Soldier').map((id) => chars(after, id).power)).toEqual([2]);
  });

  cardTest("Jeong Jeong's Deserters", () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2, 'Plains')], hand1: ["Jeong Jeong's Deserters"] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    expect(after.decision?.kind).toBe('triggerTargets'); // two creatures to choose from
    after = settle(act(after, { kind: 'targets', targets: [[ids.p1[0]!]] }));
    expect(chars(after, ids.p1[0]!).power).toBe(3);
  });

  cardTest('Katara, Heroic Healer', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(5, 'Plains')], p2: ['Gilacorn'], hand1: ['Katara, Heroic Healer'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(chars(after, ids.p1[0]!).power).toBe(3);
    expect(chars(after, named(after, 'Katara, Heroic Healer')[0]!).power).toBe(2); // "each other"
    expect(chars(after, ids.p2[0]!).power).toBe(1);
  });

  cardTest('Iroh, Firebending Instructor', () => {
    let { s, ids } = board({ p1: ['Iroh, Firebending Instructor', 'Capital Guard', 'Warship Scout'] });
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!, ids.p1[1]!] });
    s = settle(s);
    expect(chars(s, ids.p1[1]!)).toMatchObject({ power: 3, toughness: 3 });
    expect(chars(s, ids.p1[2]!).power).toBe(2); // not attacking
  });

  cardTest('Aang, Air Nomad', () => {
    const { s, ids } = board({ p1: ['Aang, Air Nomad', 'Capital Guard'], p2: ['Gilacorn'] });
    expect(chars(s, ids.p1[1]!).keywords).toContain('vigilance');
    expect(chars(s, ids.p2[0]!).keywords).not.toContain('vigilance');
    const after = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] });
    expect(after.objects[ids.p1[1]!]!.tapped).toBe(false);
  });

  cardTest('Sokka, Lateral Strategist', () => {
    const one = board({ p1: ['Sokka, Lateral Strategist', 'Capital Guard'] });
    const hand = one.s.zones['p1.hand'].length;
    const alone = settle(act(toAttack(one.s), { kind: 'attack', attackers: [one.ids.p1[0]!] }));
    expect(alone.zones['p1.hand']).toHaveLength(hand);
    const both = settle(act(toAttack(one.s), { kind: 'attack', attackers: [one.ids.p1[0]!, one.ids.p1[1]!] }));
    expect(both.zones['p1.hand']).toHaveLength(hand + 1);
  });

  cardTest('Avatar Enthusiasts', () => {
    const { s, ids } = board({ p1: ['Avatar Enthusiasts', 'Plains', 'Mountain'], hand1: ['Kyoshi Warrior Guard', 'Capital Guard'] });
    let after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(chars(after, ids.p1[0]!).power).toBe(3);
    after = structuredClone(after);
    for (const id of after.zones.battlefield) after.objects[id]!.tapped = false;
    after = settle(passBoth(act(after, { kind: 'cast', object: ids.hand1[1]! }))); // not an Ally
    expect(chars(after, ids.p1[0]!).power).toBe(3);
  });

  cardTest('First-Time Flyer', () => {
    const { s, ids } = board({ p1: ['First-Time Flyer', ...lands(3, 'Island')], hand1: ['Water Whip'] });
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 1, toughness: 2 });
    const lesson = structuredClone(s);
    lesson.zones['p1.graveyard'].push(ids.hand1[0]!);
    lesson.zones['p1.hand'].splice(lesson.zones['p1.hand'].indexOf(ids.hand1[0]!), 1);
    lesson.objects[ids.hand1[0]!]!.zone = 'p1.graveyard';
    expect(chars(lesson, ids.p1[0]!)).toMatchObject({ power: 2, toughness: 3 });
  });

  cardTest('Feed the Swarm', () => {
    const { s, ids } = board({ p1: lands(2, 'Swamp'), p2: ['Komodo Rhino'], hand1: ['Feed the Swarm'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] }));
    expect(named(after, 'Komodo Rhino')).toHaveLength(0);
    expect(lifeOf(after, 'p1')).toBe(16);
  });

  cardTest('Deny Entry', () => {
    let { s, ids } = board({ p1: lands(2), p2: lands(3, 'Island'), hand1: ['Capital Guard'], hand2: ['Deny Entry'] });
    s = act(act(s, { kind: 'cast', object: ids.hand1[0]! }), { kind: 'pass' });
    const spell = s.zones.stack[0]!;
    s = passBoth(act(s, { kind: 'cast', object: ids.hand2[0]!, targets: [[spell]] }));
    s = passUntil(s, (x) => x.decision?.kind === 'pick');
    s = settle(act(s, { kind: 'pick', cards: [s.zones['p2.hand'][0]!] }));
    expect(named(s, 'Capital Guard')).toHaveLength(0);
    expect(s.zones['p1.graveyard']).toHaveLength(1);
  });

  cardTest('Zuko, Avatar Hunter', () => {
    const { s, ids } = board({ p1: ['Zuko, Avatar Hunter', ...lands(2)], hand1: ['Lightning Strike'] });
    const after = settle(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] }));
    expect(named(after, 'Soldier')).toHaveLength(1);
  });

  cardTest('Momo, Rambunctious Rascal', () => {
    let { s, ids } = board({ p1: lands(3, 'Plains'), p2: ['Komodo Rhino'], hand1: ['Momo, Rambunctious Rascal'] });
    const untapped = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(untapped, 'Komodo Rhino')).toHaveLength(1); // no tapped target: the trigger is removed
    s = structuredClone(s); s.objects[ids.p2[0]!]!.tapped = true;
    const tapped = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(tapped, 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest('Cat-Gator', () => {
    const { s, ids } = board({ p1: lands(7, 'Swamp'), hand1: ['Cat-Gator'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = settle(act(after, { kind: 'targets', targets: [['p2']] }));
    expect(lifeOf(after, 'p2')).toBe(13);
  });

  cardTest('Eel-Hounds', () => {
    let { s, ids } = board({ p1: ['Eel-Hounds', 'Capital Guard'] });
    s = settle(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }));
    expect(chars(s, ids.p1[1]!)).toMatchObject({ power: 4, toughness: 4, keywords: ['trample'] });
  });

  cardTest("Appa, Aang's Companion", () => {
    let { s, ids } = board({ p1: ["Appa, Aang's Companion", 'Capital Guard'] });
    s = settle(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!, ids.p1[1]!] }));
    expect(chars(s, ids.p1[1]!).keywords).toContain('flying');
  });

  cardTest('Rowdy Snowballers', () => {
    const { s, ids } = board({ p1: lands(3, 'Island'), p2: ['Komodo Rhino'], hand1: ['Rowdy Snowballers'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(after.objects[ids.p2[0]!]).toMatchObject({ tapped: true, counters: { stun: 1 } });
  });
});
