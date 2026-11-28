/** Jumpstart cards, batch 9: Learning (1), Bumi, Cabbages, Bad Advice, Relentless, Ozai and Siege Engines packets. */
import { describe, expect } from 'vitest';
import { manaSources, whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const nameOfCard = (s: GameState, id: ObjectId) => s.setup.cards[s.objects[id]!.card]!.name;
const handNames = (s: GameState, p: 'p1' | 'p2' = 'p1') => s.zones[`${p}.hand`].map((id) => nameOfCard(s, id));
const ordered = (s: GameState) => (s.decision?.kind === 'triggerOrder' ? act(s, { kind: 'order', triggers: s.decision.triggers }) : s);
const ready = (s: GameState, id: ObjectId) => { const t = structuredClone(s); t.objects[id]!.controlledSince = -1; return t; };

describe('Jumpstart, batch 9', () => {
  cardTest('Crystalline Armor', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(4, 'Forest')], hand1: ['Crystalline Armor'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 6, toughness: 6, keywords: expect.arrayContaining(['trample']) });
  });

  cardTest('Guru Pathik', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(6, 'Forest')], hand1: ['Guru Pathik', 'Shared Roots'], library1: ['Octopus Form', 'Island'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ options: [ids.library1[0]] }); // the Lesson
    t = settle(act(t, { kind: 'pick', cards: [ids.library1[0]!] }));
    expect(handNames(t)).toContain('Octopus Form');
    t = act(t, { kind: 'cast', object: ids.hand1[1]! }); // a Lesson: a counter on another creature, the Guard
    t = passUntil(passBoth(t), decisionIs('pick')); // the trigger resolved; Shared Roots searches
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Shared Roots', () => {
    const { s, ids } = board({ p1: lands(2, 'Forest'), hand1: ['Shared Roots'] });
    const t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    const u = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[0]!] }));
    expect(named(u, 'Plains').map((id) => u.objects[id]!.tapped)).toEqual([true]);
  });

  cardTest("Bumi's Feast Lecture", () => {
    const { s, ids } = board({ p1: ['Food', ...lands(2, 'Forest')], hand1: ["Bumi's Feast Lecture"] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[1]!]] })));
    expect(t.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(4); // two Foods, twice
  });

  cardTest('Bumi, King of Three Trials', () => {
    const { s, ids } = board({ p1: lands(6, 'Forest'), graveyard1: ['Octopus Form', 'Consider'], hand1: ['Bumi, King of Three Trials'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('choose'));
    expect(t.decision).toMatchObject({ max: 1 }); // one Lesson in the graveyard
    expect(refused(t, { kind: 'options', indices: [0, 3] })).toMatch(/up to 1/);
    t = passUntil(act(t, { kind: 'options', indices: [3] }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [ids.p1[0]!] }));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(3);
    const two = board({ p1: lands(6, 'Forest'), graveyard1: ['Octopus Form', 'Boomerang Basics'], hand1: ['Bumi, King of Three Trials'] });
    const u = passUntil(passBoth(act(two.s, { kind: 'cast', object: two.ids.hand1[0]! })), decisionIs('choose'));
    expect(refused(u, { kind: 'options', indices: [1, 2] })).toMatch(/one mode/);
  });

  cardTest('Creeping Crystal Coating', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(3, 'Forest')], hand1: ['Creeping Crystal Coating'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(chars(t, ids.p1[0]!).toughness).toBe(5);
    t = settle(passUntil(act(toAttack(t), { kind: 'attack', attackers: [ids.p1[0]!] }), (x) => x.zones.stack.length === 1));
    expect(named(t, 'Food')).toHaveLength(1);
  });

  cardTest('Leaves from the Vine', () => {
    const { s, ids } = board({ p1: lands(2, 'Forest'), hand1: ['Leaves from the Vine'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(t.zones['p1.graveyard']).toHaveLength(3);
    expect(named(t, 'Food')).toHaveLength(1);
  });

  cardTest('Many Partings', () => {
    const { s, ids } = board({ p1: ['Forest'], hand1: ['Many Partings'] });
    const t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    const u = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[0]!] }));
    expect(named(u, 'Food')).toHaveLength(1);
    expect(u.zones['p1.hand'].filter((id) => nameOfCard(u, id) === 'Plains').length).toBeGreaterThan(0);
  });

  cardTest('The Cabbage Merchant', () => {
    const { s, ids } = board({ p1: ['The Cabbage Merchant', 'Food', 'Food'], hand1: ['Octopus Form'] });
    expect(manaSources(s, 'p1').filter((m) => m.id.startsWith('many:'))).toHaveLength(1); // two Foods: one mana of any colour
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull();
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(ids.p1.slice(1).map((id) => t.objects[id]!.tapped)).toEqual([true, true]);
  });

  cardTest('Unlucky Cabbage Merchant', () => {
    const { s, ids } = board({ p1: ['Unlucky Cabbage Merchant', 'Food', ...lands(2, 'Forest')] });
    let t = passUntil(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })), decisionIs('may'));
    t = passUntil(act(t, { kind: 'yes' }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[0]!] }));
    expect(named(t, 'Unlucky Cabbage Merchant')).toHaveLength(0);
    expect(named(t, 'Plains')).toHaveLength(1);
    expect(lifeOf(t, 'p1')).toBe(23);
  });

  cardTest('Dai Li Censor', () => {
    const { s, ids } = board({ p1: ['Dai Li Censor', 'Capital Guard', 'Swamp', 'Swamp'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).power).toBe(4);
    expect(named(t, 'Capital Guard')).toHaveLength(0); // the only other creature
    expect(refused(t, { kind: 'activate', object: ids.p1[0]!, ability: 0 })).toBeTruthy();
  });

  cardTest('Hama, the Bloodbender', () => {
    let { s, ids } = board({ p1: lands(8, 'Island'), hand1: ['Hama, the Bloodbender'], hand2: ['Octopus Form'] });
    s = structuredClone(s); // three cards on top of Claire's library: the Lesson among them
    const lib = s.zones['p2.library'];
    const octo = ids.hand2[0]!;
    s.zones['p2.hand'].splice(s.zones['p2.hand'].indexOf(octo), 1);
    lib.push(octo);
    s.objects[octo]!.zone = 'p2.library';
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: (t.decision as { options: ObjectId[] }).options }));
    const exiled = t.zones['p2.exile'][0]!;
    expect(nameOfCard(t, exiled)).toBe('Octopus Form');
    expect(t.objects[exiled]!.castableBy).toMatchObject({ player: 'p1', cost: 'waterbendManaValue' });
    // Cast by waterbending {1}: an untapped artifact or creature, or one mana.
    const hama = named(t, 'Hama, the Bloodbender')[0]!;
    expect(whyNotCast(t, 'p1', exiled)).toBeNull();
    t = settle(passBoth(act(t, { kind: 'cast', object: exiled, targets: [[hama]] })));
    expect(t.zones['p2.graveyard'].map((id) => nameOfCard(t, id))).toContain('Octopus Form');
  });

  cardTest('Joo Dee, One of Many', () => {
    const { s, ids } = board({ p1: ['Joo Dee, One of Many', 'Food', 'Swamp'] });
    let t = passUntil(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })), decisionIs('arrange'));
    t = passUntil(act(t, { kind: 'arrange', top: (t.decision as { cards: ObjectId[] }).cards, away: [] }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [ids.p1[1]!] })); // sacrifice the Food
    const joos = named(t, 'Joo Dee, One of Many');
    expect(joos).toHaveLength(2);
    expect(joos.filter((id) => t.objects[id]!.tokenCopy)).toHaveLength(1);
  });

  cardTest('Lo and Li, Royal Advisors', () => {
    const { s, ids } = board({ p1: ['Lo and Li, Royal Advisors', ...lands(3, 'Island')] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [['p2']] })));
    expect(t.zones['p2.graveyard']).toHaveLength(4);
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Sold Out', () => {
    const { s, ids } = board({ p1: lands(6, 'Swamp'), p2: ['Komodo Rhino'], hand1: ['Sold Out'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(t.zones['p2.exile']).toHaveLength(1);
    expect(named(t, 'Clue')).toHaveLength(0); // it wasn't dealt damage
    let hurt = structuredClone(s);
    hurt.objects[ids.p2[0]!]!.damage = 1;
    hurt = settle(passBoth(act(hurt, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(named(hurt, 'Clue')).toHaveLength(1);
  });

  cardTest('Azula, On the Hunt', () => {
    const { s, ids } = board({ p1: ['Azula, On the Hunt'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), decisionIs('triggerOrder'));
    t = settle(ordered(t));
    expect(lifeOf(t, 'p1')).toBe(19);
    expect(named(t, 'Clue')).toHaveLength(1);
  });

  cardTest('Canyon Crawler', () => {
    const { s, ids } = board({ p1: lands(6, 'Swamp'), hand1: ['Canyon Crawler'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(t, 'Food')).toHaveLength(1);
    expect(chars(t, named(t, 'Canyon Crawler')[0]!).keywords).toContain('deathtouch');
  });

  cardTest('Fire Nation Occupation', () => {
    const { s, ids } = board({ p1: lands(5, 'Swamp'), hand1: ['Fire Nation Occupation', 'Sold Out'], p2: ['Komodo Rhino'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(t, 'Soldier')).toHaveLength(1);
    t = passUntil(t, (x) => x.active === 'p2' && x.step === 'main1' && x.decision?.kind === 'priority');
    t = act(t, { kind: 'pass' });
    expect(t.decision).toMatchObject({ kind: 'priority', player: 'p1' });
    expect(whyNotCast(t, 'p1', ids.hand1[1]!)).toMatch(/mana/); // three lands tapped this turn... untapped on Claire's? no: they untap only in Lawrence's untap step
  });

  cardTest('Zhao, Ruthless Admiral', () => {
    const { s, ids } = board({ p1: ['Zhao, Ruthless Admiral', 'Food', ...lands(2)] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).power).toBe(4);
  });

  cardTest('Pirate Peddlers', () => {
    const { s, ids } = board({ p1: ['Pirate Peddlers', 'Food', ...lands(2)] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Ruthless Waterbender', () => {
    const { s, ids } = board({ p1: ['Ruthless Waterbender', 'Capital Guard', 'Swamp'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 2, toughness: 4 });
  });

  cardTest('Fire Lord Ozai', () => {
    const { s, ids } = board({ p1: ['Fire Lord Ozai', 'Komodo Rhino'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), decisionIs('pick'));
    t = act(t, { kind: 'pick', cards: [ids.p1[1]!] });
    expect(t.players.p1.combatPool.R).toBe(5);
    // {6}: the top card of Claire's library, playable for free this turn.
    const six = board({ p1: ['Fire Lord Ozai', ...lands(6)] });
    const u = settle(passBoth(act(six.s, { kind: 'activate', object: six.ids.p1[0]!, ability: 0 })));
    const exiled = u.zones['p2.exile'][0]!;
    expect(u.objects[exiled]!.castableBy).toMatchObject({ player: 'p1', cost: 'free' });
    const played = act(u, { kind: 'play', object: exiled }); // a Forest: played from Claire's exile
    expect(named(played, 'Forest').map((id) => played.objects[id]!.controller)).toEqual(['p1']);
  });

  cardTest('Fire Navy Trebuchet', () => {
    const { s, ids } = board({ p1: ['Fire Navy Trebuchet', 'Komodo Rhino'] });
    let t = settle(passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] }), (x) => x.zones.stack.length === 1));
    const boulder = named(t, 'Ballistic Boulder')[0]!;
    expect(t.objects[boulder]).toMatchObject({ tapped: true, attacking: 'p2' });
    t = settle(passUntil(t, (x) => x.step === 'end' && x.zones.stack.length === 1));
    expect(named(t, 'Ballistic Boulder')).toHaveLength(0);
  });

  cardTest('Scarring Memories', () => {
    const { s, ids } = board({ p1: lands(4, 'Swamp'), p2: ['Komodo Rhino', 'Capital Guard'], hand1: ['Scarring Memories'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ player: 'p2', options: [ids.p2[0], ids.p2[1]] }); // Claire chooses
    t = passUntil(act(t, { kind: 'pick', cards: [ids.p2[1]!] }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [t.zones['p2.hand'][0]!] }));
    expect(named(t, 'Capital Guard')).toHaveLength(0);
    expect(lifeOf(t, 'p2')).toBe(17);
  });

  cardTest('Fire Nation Warship', () => {
    const { s, ids } = board({ p1: ['Fire Nation Warship', 'Capital Guard', 'Callous Inspector'] });
    expect(chars(s, ids.p1[0]!).types).not.toContain('Creature');
    expect(refused(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })).toMatch(/crew/);
    expect(refused(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, tapping: [ids.p1[2]!] })).toMatch(/power 2/);
    const t = act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, tapping: [ids.p1[1]!] });
    const u = settle(passBoth(t));
    expect(chars(u, ids.p1[0]!).types).toContain('Creature');
    expect(u.objects[ids.p1[1]!]!.tapped).toBe(true);
  });

  cardTest('The Fire Nation Drill', () => {
    const { s, ids } = board({ p1: lands(4, 'Swamp'), p2: ['Capital Guard', 'Komodo Rhino'], hand1: ['The Fire Nation Drill'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('may'));
    t = settle(act(t, { kind: 'yes' })); // the one creature with power 4 or less is the target
    expect(named(t, 'Capital Guard')).toHaveLength(0);
    expect(t.objects[named(t, 'The Fire Nation Drill')[0]!]!.tapped).toBe(true);
  });

  cardTest('Tundra Tank', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(3, 'Swamp')], hand1: ['Tundra Tank'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(chars(t, ids.p1[0]!).keywords).toContain('indestructible');
    const tank = ready(t, named(t, 'Tundra Tank')[0]!);
    expect(refused(tank, { kind: 'activate', object: named(tank, 'Tundra Tank')[0]!, ability: 0, tapping: [] })).toMatch(/power/);
  });
});
