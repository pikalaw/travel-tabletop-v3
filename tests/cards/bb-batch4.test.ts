/** Beginner Box cards, batch 4: optional costs, fights, "unless pays", this-turn memory, two-mana sources, cost reduction, block rules. */
import { describe, expect } from 'vitest';
import { manaSources } from '../../src/engine/engine';
import type { GameState } from '../../src/engine/types';
import { act, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const toBlock = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'blockers');

describe('Beginner Box, batch 4', () => {
  cardTest('Beetle-Headed Merchants', () => {
    let { s, ids } = board({ p1: ['Beetle-Headed Merchants', 'Capital Guard'] });
    s = passBoth(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }));
    expect(s.decision).toMatchObject({ kind: 'pick', done: 'Sacrifice', orNone: true, options: [ids.p1[1]] });
    const hand = s.zones['p1.hand'].length;
    const yes = settle(act(s, { kind: 'pick', cards: [ids.p1[1]!] }));
    expect(yes.zones['p1.hand']).toHaveLength(hand + 1);
    expect(chars(yes, ids.p1[0]!).power).toBe(6);
    const no = settle(act(s, { kind: 'pick', cards: [] }));
    expect(no.zones['p1.hand']).toHaveLength(hand);
  });

  cardTest('Yuyan Archers', () => {
    const { s, ids } = board({ p1: lands(2), hand1: ['Yuyan Archers', 'Capital Guard'] });
    let after = passBoth(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(after.decision).toMatchObject({ kind: 'pick', done: 'Discard', orNone: true });
    after = settle(act(after, { kind: 'pick', cards: [ids.hand1[1]!] }));
    expect(after.zones['p1.graveyard']).toHaveLength(1);
  });

  cardTest('Abandon Attachments', () => {
    const { s, ids } = board({ p1: lands(2), hand1: ['Abandon Attachments', 'Capital Guard'] });
    const hand = s.zones['p1.hand'].length;
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = settle(act(after, { kind: 'pick', cards: [ids.hand1[1]!] }));
    expect(after.zones['p1.hand']).toHaveLength(hand - 2 + 2);
  });

  cardTest('Lion Vulture', () => {
    let { s, ids } = board({ p1: ['Lion Vulture', ...lands(2)], hand1: ['Lightning Strike'] });
    const quiet = passUntil(s, (x) => x.turn === 2);
    expect(quiet.objects[ids.p1[0]!]!.counters['+1/+1']).toBeUndefined();
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] })));
    s = passUntil(s, (x) => x.turn === 2);
    expect(s.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Fire Nation Engineer', () => {
    let { s, ids } = board({ p1: ['Fire Nation Engineer', 'Capital Guard'] });
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] });
    s = passUntil(s, (x) => x.turn === 2);
    expect(s.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(1); // the only other creature: no question
  });

  cardTest('Otter-Penguin', () => {
    // Lawrence's second turn: the draw step is his first card, Explore draws his second.
    let { s, ids } = board({ p1: ['Otter-Penguin', ...lands(2, 'Forest')], hand1: ['Explore'] });
    s = passUntil(s, (x) => x.turn === 3 && x.step === 'main1' && x.decision?.kind === 'priority');
    expect(s.turnLog.drawn.p1).toBe(1);
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 3, toughness: 3, keywords: ["can't be blocked"] });
  });

  cardTest('Long Feng, Grand Secretariat', () => {
    const { s, ids } = board({ p1: ['Long Feng, Grand Secretariat', 'Capital Guard', ...lands(2)], hand1: ['Lightning Strike'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[1]!]] })));
    expect(after.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest("Flopsie, Bumi's Buddy", () => {
    const f = board({ p1: ["Flopsie, Bumi's Buddy", 'Komodo Rhino'], p2: ['Capital Guard', 'Warship Scout'] });
    const s = toBlock(act(toAttack(f.s), { kind: 'attack', attackers: [f.ids.p1[1]!] }));
    expect(refused(s, { kind: 'block', blocks: [{ blocker: f.ids.p2[0]!, attacker: f.ids.p1[1]! }, { blocker: f.ids.p2[1]!, attacker: f.ids.p1[1]! }] })).toMatch(/more than one/);
    const cast = board({ p1: ['Capital Guard', ...lands(6, 'Forest')], hand1: ["Flopsie, Bumi's Buddy"] });
    const after = settle(passBoth(act(cast.s, { kind: 'cast', object: cast.ids.hand1[0]! })));
    expect(chars(after, cast.ids.p1[0]!).power).toBe(3);
  });

  cardTest('Hog-Monkey Rampage', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', 'Forest', 'Mountain'], p2: ['Turtle-Seals'], hand1: ['Hog-Monkey Rampage'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!], [ids.p2[0]!]] })));
    expect(named(after, 'Turtle-Seals')).toHaveLength(0); // 6 power after the counter
    expect(chars(after, ids.p1[0]!).power).toBe(6);
  });

  cardTest('Earth Rumble', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(4, 'Forest')], p2: ['Turtle-Seals'], hand1: ['Earth Rumble'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[1]!], [ids.p1[0]!], [ids.p2[0]!]] })));
    expect(named(after, 'Turtle-Seals')).toHaveLength(0);
    expect(chars(after, ids.p1[1]!).power).toBe(2);
  });

  cardTest('How to Start a Riot', () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Warship Scout', ...lands(3)], hand1: ['How to Start a Riot'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!], ['p1']] }));
    expect(chars(after, ids.p1[0]!)).toMatchObject({ power: 4, keywords: ['menace'] });
    expect(chars(after, ids.p1[1]!).power).toBe(4);
  });

  cardTest("Ozai's Cruelty", () => {
    const { s, ids } = board({ p1: lands(3, 'Swamp'), hand1: ["Ozai's Cruelty"] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] }));
    expect(after.decision).toMatchObject({ kind: 'pick', player: 'p2', min: 2, max: 2 });
    after = settle(act(after, { kind: 'pick', cards: after.zones['p2.hand'].slice(0, 2) }));
    expect(lifeOf(after, 'p2')).toBe(18);
  });

  cardTest('Earth Kingdom Soldier', () => {
    const { s, ids } = board({ p1: ['Capital Guard', 'Warship Scout', ...lands(5, 'Plains')], hand1: ['Earth Kingdom Soldier'] });
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    after = settle(act(after, { kind: 'targets', targets: [[ids.p1[0]!, ids.p1[1]!]] }));
    expect([chars(after, ids.p1[0]!).power, chars(after, ids.p1[1]!).power]).toEqual([3, 3]);
  });

  cardTest('Lost in the Spirit World', () => {
    const { s, ids } = board({ p1: lands(3, 'Island'), p2: ['Komodo Rhino'], hand1: ['Lost in the Spirit World'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] }));
    expect(named(after, 'Komodo Rhino')).toHaveLength(0);
    expect(named(after, 'Spirit')).toHaveLength(1);
  });

  cardTest('Spirit', () => {
    let { s, ids } = board({ p1: ['Capital Guard'], p2: ['Spirit', 'Warship Scout'] });
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = toBlock(s);
    expect(refused(s, { kind: 'block', blocks: [{ blocker: ids.p2[0]!, attacker: ids.p1[0]! }] })).toMatch(/can't block/);
  });

  cardTest('Cat-Owl', () => {
    let { s, ids } = board({ p1: ['Cat-Owl', 'Capital Guard'] });
    s = structuredClone(s); s.objects[ids.p1[1]!]!.tapped = true;
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = settle(act(passUntil(s, (x) => x.decision?.kind === 'triggerTargets'), { kind: 'targets', targets: [[ids.p1[1]!]] }));
    expect(s.objects[ids.p1[1]!]!.tapped).toBe(false);
  });

  cardTest("It'll Quench Ya!", () => {
    let { s, ids } = board({ p1: lands(4), p2: lands(2, 'Island'), hand1: ['Lightning Strike'], hand2: ["It'll Quench Ya!"] });
    s = act(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] }), { kind: 'pass' });
    s = passBoth(act(s, { kind: 'cast', object: ids.hand2[0]!, targets: [[s.zones.stack[0]!]] }));
    expect(s.decision).toMatchObject({ kind: 'payOrElse', player: 'p1', cost: '{2}' });
    const paid = settle(act(s, { kind: 'yes' }));
    expect(lifeOf(paid, 'p2')).toBe(17);
    const countered = settle(act(s, { kind: 'no' }));
    expect(lifeOf(countered, 'p2')).toBe(20);
  });

  cardTest('Serpent of the Pass', () => {
    let { s, ids } = board({ p1: lands(4, 'Island'), hand1: ['Serpent of the Pass', 'Lightning Strike', 'Water Whip', 'Explore'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]! })).toMatch(/mana/); // {5}{U}{U} from four lands
    s = structuredClone(s);
    for (const id of ids.hand1.slice(1)) { s.zones['p1.hand'].splice(s.zones['p1.hand'].indexOf(id), 1); s.zones['p1.graveyard'].push(id); s.objects[id]!.zone = 'p1.graveyard'; }
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })); // three noncreature, nonland cards: {2}{U}{U}
    expect(named(s, 'Serpent of the Pass')).toHaveLength(1);
  });

  cardTest("Bender's Waterskin", () => {
    let { s, ids } = board({ p1: ["Bender's Waterskin"] });
    expect(manaSources(s, 'p1').find((m) => m.id === ids.p1[0])?.makes).toHaveLength(5);
    s = structuredClone(s); s.objects[ids.p1[0]!]!.tapped = true;
    s = passUntil(s, (x) => x.turn === 2 && x.step !== 'untap');
    expect(s.objects[ids.p1[0]!]!.tapped).toBe(false); // untapped in Claire's untap step
  });

  cardTest('Raucous Audience', () => {
    const small = board({ p1: ['Raucous Audience'] });
    expect(manaSources(small.s, 'p1').filter((m) => m.id.startsWith(small.ids.p1[0]!))).toHaveLength(1);
    const big = board({ p1: ['Raucous Audience', 'Komodo Rhino'], hand1: ['Capital Guard'] });
    expect(manaSources(big.s, 'p1').filter((m) => m.id.startsWith(big.ids.p1[0]!))).toHaveLength(2);
  });

  cardTest('Match the Odds', () => {
    const { s, ids } = board({ p1: lands(3, 'Forest'), p2: ['Capital Guard', 'Warship Scout'], hand1: ['Match the Odds'] });
    const after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    expect(chars(after, named(after, 'Ally')[0]!).power).toBe(3);
  });
});
