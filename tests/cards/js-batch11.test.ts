/** Jumpstart cards, batch 11: Insurgent, Hei Bai (1), Airbending, Swordmaster, Warriors, Freedom Fighters and Gliding (2) packets. */
import { describe, expect } from 'vitest';
import { libraryTopSeen, whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const nameOfCard = (s: GameState, id: ObjectId) => s.setup.cards[s.objects[id]!.card]!.name;
const handNames = (s: GameState) => s.zones['p1.hand'].map((id) => nameOfCard(s, id));

describe('Jumpstart, batch 11', () => {
  cardTest('Appa, Loyal Sky Bison', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(6, 'Plains')], hand1: ['Appa, Loyal Sky Bison'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('choose'));
    t = passUntil(act(t, { kind: 'options', indices: [0] }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [ids.p1[0]!] }));
    expect(chars(t, ids.p1[0]!).keywords).toContain('flying');
  });

  cardTest("Duelist's Heritage", () => {
    const { s, ids } = board({ p1: ["Duelist's Heritage", 'Capital Guard'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] }), decisionIs('may'));
    t = settle(act(t, { kind: 'yes' }));
    expect(chars(t, ids.p1[1]!).keywords).toContain('double strike');
  });

  cardTest('Hakoda, Selfless Commander', () => {
    const { s, ids } = board({ p1: ['Hakoda, Selfless Commander', ...lands(3, 'Plains')], library1: ['Koala-Sheep', 'Invasion Reinforcements'] });
    expect(libraryTopSeen(s, 'p1')).toBe(ids.library1[0]);
    expect(whyNotCast(s, 'p1', ids.library1[0]!)).toBe('Not in your hand'); // not an Ally
    const ally = board({ p1: ['Hakoda, Selfless Commander', ...lands(2, 'Plains')], library1: ['Invasion Reinforcements'] });
    expect(whyNotCast(ally.s, 'p1', ally.ids.library1[0]!)).toBeNull();
    let t = settle(passBoth(act(ally.s, { kind: 'cast', object: ally.ids.library1[0]! })));
    expect(named(t, 'Invasion Reinforcements')).toHaveLength(1);
    t = settle(passBoth(act(t, { kind: 'activate', object: ally.ids.p1[0]!, ability: 0 })));
    expect(chars(t, named(t, 'Ally')[0]!)).toMatchObject({ toughness: 6, keywords: expect.arrayContaining(['indestructible']) });
  });

  cardTest("Airbender's Reversal", () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2, 'Plains')], hand1: ["Airbender's Reversal"] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [1], targets: [[ids.p1[0]!]] })));
    expect(t.zones['p1.exile']).toHaveLength(1);
  });

  cardTest('Invasion Reinforcements', () => {
    const { s, ids } = board({ p1: lands(2, 'Plains'), hand1: ['Invasion Reinforcements'] });
    expect(named(settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }))), 'Ally')).toHaveLength(1);
  });

  cardTest('Tale of Momo', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), graveyard1: ['Invasion Reinforcements'], hand1: ['Tale of Momo'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ options: [ids.graveyard1[0]] }); // from the graveyard too
    t = settle(act(t, { kind: 'pick', cards: [ids.graveyard1[0]!] }));
    expect(handNames(t)).toContain('Invasion Reinforcements');
    const cheap = board({ p1: ['Capital Guard', ...lands(6, 'Swamp'), 'Plains'], hand1: ['Tale of Momo', 'Deadly Precision'] });
    expect(whyNotCast(cheap.s, 'p1', cheap.ids.hand1[0]!)).toBeNull();
  });

  cardTest('Koala-Sheep', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), hand1: ['Koala-Sheep'] });
    expect(lifeOf(settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }))), 'p1')).toBe(23);
  });

  cardTest("Sandbenders' Storm", () => {
    const { s, ids } = board({ p1: lands(4, 'Plains'), p2: ['Komodo Rhino'], hand1: ["Sandbenders' Storm"] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0], targets: [[ids.p2[0]!]] })));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest('Vengeful Villagers', () => {
    const { s, ids } = board({ p1: ['Vengeful Villagers', 'Food'], p2: ['Komodo Rhino'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), decisionIs('pick'));
    t = act(t, { kind: 'pick', cards: [ids.p1[1]!] });
    expect(t.objects[ids.p2[0]!]).toMatchObject({ tapped: true, counters: { stun: 1 } });
  });

  cardTest('Airbender Ascension', () => {
    let { s, ids } = board({ p1: ['Airbender Ascension', 'Capital Guard'] });
    s = structuredClone(s);
    s.objects[ids.p1[0]!]!.counters.quest = 4;
    let t = passUntil(s, (x) => x.step === 'end' && x.decision?.kind === 'triggerTargets');
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[ids.p1[1]!]] })));
    expect(named(t, 'Capital Guard')).toHaveLength(1); // back at once, a new object
    expect(t.zones.battlefield).not.toContain(ids.p1[1]);
  });

  cardTest('Monk Gyatso', () => {
    const { s, ids } = board({ p1: ['Monk Gyatso', 'Capital Guard', ...lands(2, 'Plains')], hand1: ['Yip Yip!'] });
    let t = passUntil(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[1]!]] }), decisionIs('may'));
    t = settle(act(t, { kind: 'yes' }));
    expect(t.zones['p1.exile']).toHaveLength(1); // airbent before Yip Yip! resolves
  });

  cardTest('Earth Kingdom Protectors', () => {
    const { s, ids } = board({ p1: ['Earth Kingdom Protectors', 'Kyoshi Warriors'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p1[1]!]] })));
    expect(chars(t, ids.p1[1]!).keywords).toContain('indestructible');
  });

  cardTest('Meteor Sword', () => {
    const { s, ids } = board({ p1: lands(7), p2: ['Komodo Rhino'], hand1: ['Meteor Sword'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[ids.p2[0]!]] })));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest('Sokka, Swordmaster', () => {
    const { s, ids } = board({ p1: ['Sokka, Swordmaster', 'Kyoshi Warriors', ...lands(4, 'Plains')], hand1: ['Glider Staff'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull();
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = settle(act(t, { kind: 'targets', targets: [[]] })); // airbend nothing
    expect(ids.p1.slice(2).filter((id) => !t.objects[id]!.tapped)).toHaveLength(3); // {2}{W} less two Allies: one land
    t = passUntil(t, (x) => x.step === 'beginCombat' && x.decision?.kind === 'triggerTargets');
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[named(t, 'Glider Staff')[0]!]] })));
    expect(chars(t, ids.p1[0]!).keywords).toContain('flying');
  });

  cardTest('Trusty Boomerang', () => {
    let { s, ids } = board({ p1: ['Trusty Boomerang', 'Capital Guard', 'Plains', 'Plains'], p2: ['Komodo Rhino'] });
    s = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 1, targets: [[ids.p1[1]!]] })));
    s = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p2[0]!]] })));
    expect(s.objects[ids.p2[0]!]!.tapped).toBe(true);
    expect(s.objects[ids.p1[1]!]!.tapped).toBe(true);
    expect(handNames(s)).toContain('Trusty Boomerang');
  });

  cardTest('Suki, Kyoshi Captain', () => {
    const { s, ids } = board({ p1: ['Suki, Kyoshi Captain', 'Kyoshi Warriors', ...lands(4, 'Plains')] });
    expect(chars(s, ids.p1[1]!).power).toBe(4);
    let t = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] });
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[1]!).keywords).toContain('double strike');
  });

  cardTest('Team Avatar', () => {
    const { s, ids } = board({ p1: ['Team Avatar', 'Capital Guard', 'Kyoshi Warriors'] });
    const t = settle(passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] }), (x) => x.zones.stack.length === 1));
    expect(chars(t, ids.p1[1]!).power).toBe(4);
    const two = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!, ids.p1[2]!] });
    expect(two.zones.stack).toHaveLength(0);
  });

  cardTest('Toucan-Puffin', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), hand1: ['Toucan-Puffin'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(chars(t, named(t, 'Toucan-Puffin')[0]!).power).toBe(4);
  });

  cardTest('Valorous Stance', () => {
    const { s, ids } = board({ p1: lands(2, 'Plains'), p2: ['Komodo Rhino', 'Earth Rumble Wrestlers'], hand1: ['Valorous Stance'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, modes: [1], targets: [[ids.p2[0]!]] })).toMatch(/target/);
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [1], targets: [[ids.p2[1]!]] })));
    expect(named(t, 'Earth Rumble Wrestlers')).toHaveLength(0);
  });

  cardTest('Hook Swords', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), hand1: ['Hook Swords'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(chars(t, named(t, 'Ally')[0]!)).toMatchObject({ power: 2, toughness: 2, keywords: ['first strike'] });
  });

  cardTest('Pipsqueak, Rebel Strongarm', () => {
    const { s, ids } = board({ p1: ['Pipsqueak, Rebel Strongarm', 'Capital Guard'] });
    expect(refused(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] })).toMatch(/alone/);
    expect(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!, ids.p1[1]!] }).objects[ids.p1[0]!]!.attacking).toBe('p2');
  });

  cardTest('Wandering Musicians', () => {
    const { s, ids } = board({ p1: ['Wandering Musicians', 'Capital Guard'] });
    const t = settle(passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), (x) => x.zones.stack.length === 1));
    expect(chars(t, ids.p1[1]!).power).toBe(3);
  });

  cardTest('Air Nomad Student', () => {
    const { s, ids } = board({ p1: ['Air Nomad Student'] });
    const t = settle(passUntil(s, (x) => x.step === 'end' && x.zones.stack.length === 1));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Glider Staff', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), hand1: ['Glider Staff'], p2: ['Komodo Rhino'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[ids.p2[0]!]] })));
    expect(t.zones['p2.exile']).toHaveLength(1);
  });

  cardTest('Momo, Friendly Flier', () => {
    const { s, ids } = board({ p1: ['Momo, Friendly Flier', ...lands(4, 'Plains')], hand1: ['Toucan-Puffin', 'Toucan-Puffin'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull();
    const t = act(s, { kind: 'cast', object: ids.hand1[0]! }); // {2}{W} less one: two lands left
    expect(ids.p1.slice(1).filter((id) => !t.objects[id]!.tapped)).toHaveLength(2);
    expect(whyNotCast(t, 'p1', ids.hand1[1]!)).toMatch(/mana|main phase/); // only the first each turn costs less
  });

  cardTest('Water Tribe Captain', () => {
    const { s, ids } = board({ p1: ['Water Tribe Captain', ...lands(5, 'Plains')] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).power).toBe(4);
  });

  cardTest('Yip Yip!', () => {
    const { s, ids } = board({ p1: ['Kyoshi Warriors', 'Plains'], hand1: ['Yip Yip!'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 5, keywords: expect.arrayContaining(['flying']) });
  });
});
