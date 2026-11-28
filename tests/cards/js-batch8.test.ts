/** Jumpstart cards, batch 8: Soaring (2), Adept (1), Wise, Spirit, Lessons, Librarian and Learning (2) packets. */
import { describe, expect } from 'vitest';
import { whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const nameOfCard = (s: GameState, id: ObjectId) => s.setup.cards[s.objects[id]!.card]!.name;
const handNames = (s: GameState, p: 'p1' | 'p2' = 'p1') => s.zones[`${p}.hand`].map((id) => nameOfCard(s, id));
/** Answers trigger order with the order offered, then settles. */
const ordered = (s: GameState) => settle(s.decision?.kind === 'triggerOrder' ? act(s, { kind: 'order', triggers: s.decision.triggers }) : s);

describe('Jumpstart, batch 8', () => {
  cardTest('Benevolent River Spirit', () => {
    const { s, ids } = board({ p1: lands(7, 'Island'), p2: lands(3), hand1: ['Benevolent River Spirit'], hand2: ['Lightning Strike'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('arrange')); // scry 2 as it enters
    t = settle(act(t, { kind: 'arrange', top: (t.decision as { cards: ObjectId[] }).cards, away: [] }));
    const spirit = named(t, 'Benevolent River Spirit')[0]!;
    // Ward {2}: Claire's Lightning Strike is countered unless she pays {2}.
    t = passUntil(t, (x) => x.decision?.kind === 'priority' && x.decision.player === 'p2');
    t = act(t, { kind: 'cast', object: ids.hand2[0]!, targets: [[spirit]] });
    t = passUntil(passBoth(t), decisionIs('payOrElse'));
    expect(t.decision).toMatchObject({ player: 'p2', cost: '{2}' });
    t = settle(act(t, { kind: 'no' }));
    expect(t.objects[spirit]!.damage).toBe(0);
    expect(t.zones['p2.graveyard']).toHaveLength(1);
  });

  cardTest('Yue, the Moon Spirit', () => {
    const { s, ids } = board({ p1: ['Yue, the Moon Spirit', ...lands(5, 'Island')], p2: ['Komodo Rhino'], hand1: ["Zuko's Exile"] });
    let t = passUntil(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })), decisionIs('castFree'));
    expect(t.decision).toMatchObject({ options: [ids.hand1[0]] });
    expect(refused(t, { kind: 'cast', object: ids.hand1[0]! })).toMatch(/target/);
    t = settle(passBoth(act(t, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest('Crashing Wave', () => {
    const { s, ids } = board({ p1: lands(4, 'Island'), p2: ['Komodo Rhino', 'Capital Guard'], hand1: ['Crashing Wave'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, x: 3, targets: [[ids.p2[0]!, ids.p2[1]!]] })).toMatch(/mana/); // {U}{U} and waterbend {3}: five, from four lands
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, x: 2, targets: [[ids.p2[0]!, ids.p2[1]!]] })), decisionIs('distribute'));
    expect(t.decision).toMatchObject({ total: 3, options: [ids.p2[0], ids.p2[1]] });
    t = settle(act(t, { kind: 'distribute', amounts: { [ids.p2[0]!]: 2, [ids.p2[1]!]: 1 } }));
    expect(t.objects[ids.p2[0]!]!.counters.stun).toBe(2);
    expect(t.objects[ids.p2[1]!]!.tapped).toBe(true);
  });

  cardTest('Dramatic Reversal', () => {
    let { s, ids } = board({ p1: ['Komodo Rhino', 'Island', 'Island'], hand1: ['Dramatic Reversal'] });
    s = structuredClone(s);
    s.objects[ids.p1[0]!]!.tapped = true;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(t.objects[ids.p1[0]!]!.tapped).toBe(false);
    expect(t.objects[ids.p1[1]!]!.tapped).toBe(true); // lands stay tapped
  });

  cardTest("Unagi's Spray", () => {
    const { s, ids } = board({ p1: ['Tiger-Seal', 'Island'], p2: ['Komodo Rhino'], hand1: ["Unagi's Spray"] });
    const hand = s.zones['p1.hand'].length;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(chars(t, ids.p2[0]!).power).toBe(1);
    expect(t.zones['p1.hand']).toHaveLength(hand); // a Seal: one cast, one drawn
  });

  cardTest('Knowledge Seeker', () => {
    const { s, ids } = board({ p1: ['Knowledge Seeker', 'Clue', 'Clue', ...lands(4, 'Island')] });
    let t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })));
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[2]!, ability: 0 })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1); // the second card this turn (turn 1 had no draw step for p1)
  });

  cardTest('Tiger-Seal', () => {
    const { s, ids } = board({ p1: ['Tiger-Seal'] });
    const t = passUntil(s, (x) => x.turn === 3 && x.step === 'draw' && x.decision?.kind === 'priority');
    expect(t.objects[ids.p1[0]!]!.tapped).toBe(true); // tapped in upkeep; one draw doesn't untap it
  });

  cardTest('Whirlwind Technique', () => {
    const { s, ids } = board({ p1: lands(6, 'Island'), p2: ['Komodo Rhino', 'Capital Guard'], hand1: ['Whirlwind Technique'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2'], [ids.p2[0]!, ids.p2[1]!]] })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ player: 'p2' }); // Claire discards
    t = settle(act(t, { kind: 'pick', cards: [t.zones['p2.hand'][0]!] }));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
    expect(t.zones['p2.exile']).toHaveLength(2);
  });

  cardTest('Coastal Piracy', () => {
    const { s, ids } = board({ p1: ['Coastal Piracy', 'Komodo Rhino'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] }), decisionIs('may'));
    const hand = t.zones['p1.hand'].length;
    t = settle(act(t, { kind: 'yes' }));
    expect(t.zones['p1.hand']).toHaveLength(hand + 1);
  });

  cardTest("Waterbender's Restoration", () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(3, 'Island')], hand1: ["Waterbender's Restoration"] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, x: 1, targets: [[ids.p1[0]!]] })));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
    t = settle(passUntil(t, (x) => x.step === 'end' && x.zones.stack.length === 1));
    expect(named(t, 'Komodo Rhino')).toHaveLength(1);
  });

  cardTest('Baboon Spirit', () => {
    const { s, ids } = board({ p1: ['Baboon Spirit', 'Komodo Rhino', ...lands(6, 'Island')], hand1: ['Knowledge Seeker'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(t, 'Spirit')).toHaveLength(1); // a Fox Spirit entered
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p1[1]!]] })));
    expect(named(t, 'Komodo Rhino')).toHaveLength(0);
    t = settle(passUntil(t, (x) => x.step === 'end' && x.zones.stack.length === 1));
    expect(named(t, 'Komodo Rhino')).toHaveLength(1);
  });

  cardTest('Dutiful Knowledge Seeker', () => {
    const { s, ids } = board({ p1: ['Dutiful Knowledge Seeker', ...lands(3, 'Island')], graveyard1: ['Consider'] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.graveyard1[0]!]] })));
    expect(nameOfCard(t, t.zones['p1.library'][0]!)).toBe('Consider'); // the bottom
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('The Spirit Oasis', () => {
    const { s, ids } = board({ p1: lands(3, 'Island'), hand1: ['The Spirit Oasis'] });
    const hand = s.zones['p1.hand'].length;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(t.zones['p1.hand']).toHaveLength(hand); // itself, a Shrine: one drawn
  });

  cardTest('Accumulate Wisdom', () => {
    const few = board({ p1: lands(2, 'Island'), hand1: ['Accumulate Wisdom'], library1: ['Consider', 'Brainstorm', 'Komodo Rhino'] });
    let t = passUntil(passBoth(act(few.s, { kind: 'cast', object: few.ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ min: 1, max: 1 });
    t = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[2]!] }));
    expect(handNames(t)).toContain('Komodo Rhino');
    expect(t.zones['p1.library'].slice(0, 2).map((id) => nameOfCard(t, id))).toEqual(['Consider', 'Brainstorm']);
    const many = board({ p1: lands(2, 'Island'), hand1: ['Accumulate Wisdom'], library1: ['Consider', 'Brainstorm', 'Komodo Rhino'], graveyard1: ['Octopus Form', 'Boomerang Basics', 'The Art of Tea'] });
    const u = settle(passBoth(act(many.s, { kind: 'cast', object: many.ids.hand1[0]! })));
    expect(handNames(u)).toEqual(expect.arrayContaining(['Consider', 'Brainstorm', 'Komodo Rhino']));
  });

  cardTest('Chakra Meditation', () => {
    const { s, ids } = board({ p1: lands(4, 'Island'), hand1: ['Chakra Meditation', 'Brainstorm'], graveyard1: ['Consider'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = settle(act(t, { kind: 'targets', targets: [[ids.graveyard1[0]!]] }));
    expect(handNames(t)).toContain('Consider');
    t = act(t, { kind: 'cast', object: ids.hand1[1]! });
    t = passUntil(passBoth(t), decisionIs('pick')); // Chakra: draw, then discard
    expect(t.decision).toMatchObject({ min: 1, max: 1, done: 'Discard' });
  });

  cardTest('Katara, Seeking Revenge', () => {
    const { s, ids } = board({ p1: lands(6, 'Island'), graveyard1: ['Octopus Form'], hand1: ['Katara, Seeking Revenge'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]! })).toMatch(/additional cost/);
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 1 })));
    const katara = named(t, 'Katara, Seeking Revenge')[0]!;
    expect(t.objects[katara]!.castWith).toBe(1);
    expect(chars(t, katara)).toMatchObject({ power: 4, toughness: 4 }); // one Lesson
    expect(t.decision?.kind).toBe('priority'); // paid: drew, no discard
  });

  cardTest('Platypus-Bear', () => {
    const { s, ids } = board({ p1: lands(2, 'Forest'), hand1: ['Platypus-Bear'], library1: ['Octopus Form', 'Island'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const bear = named(t, 'Platypus-Bear')[0]!;
    expect(t.zones['p1.graveyard']).toHaveLength(2);
    expect(chars(t, bear).keywords).toContain("can attack as though it didn't have defender");
  });

  cardTest('Brainstorm', () => {
    const { s, ids } = board({ p1: ['Island'], hand1: ['Brainstorm', 'Komodo Rhino', 'Consider'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ min: 2, max: 2 });
    t = settle(act(t, { kind: 'pick', cards: [ids.hand1[1]!, ids.hand1[2]!] }));
    const lib = t.zones['p1.library'];
    expect([lib[lib.length - 1], lib[lib.length - 2]].map((id) => nameOfCard(t, id!))).toEqual(['Komodo Rhino', 'Consider']);
  });

  cardTest('Suspicious Bookcase', () => {
    const { s, ids } = board({ p1: ['Suspicious Bookcase', 'Komodo Rhino', ...lands(3)] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p1[1]!]] })));
    expect(chars(t, ids.p1[1]!).keywords).toContain("can't be blocked");
  });

  cardTest('Wan Shi Tong, All-Knowing', () => {
    const { s, ids } = board({ p1: lands(5, 'Island'), p2: ['Komodo Rhino'], hand1: ['Wan Shi Tong, All-Knowing'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = passUntil(passBoth(act(t, { kind: 'targets', targets: [[ids.p2[0]!]] })), decisionIs('choose'));
    t = ordered(act(t, { kind: 'option', index: 1 })); // Claire puts it on the bottom
    expect(nameOfCard(t, t.zones['p2.library'][0]!)).toBe('Komodo Rhino');
    expect(named(t, 'Spirit')).toHaveLength(2);
  });

  cardTest("Zuko's Exile", () => {
    const { s, ids } = board({ p1: lands(5, 'Island'), p2: ['Komodo Rhino'], hand1: ["Zuko's Exile"] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(t.zones['p2.exile']).toHaveLength(1);
    expect(named(t, 'Clue').map((id) => t.objects[id]!.controller)).toEqual(['p2']);
  });

  cardTest('Aang, A Lot to Learn', () => {
    const { s, ids } = board({ p1: ['Aang, A Lot to Learn', 'Capital Guard', ...lands(5, 'Swamp')], graveyard1: ['Octopus Form'], hand1: ['Deadly Precision'] });
    expect(chars(s, ids.p1[0]!).keywords).toContain('vigilance');
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.p1[1]!]] })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Sparring Dummy', () => {
    const lesson = board({ p1: ['Sparring Dummy'], library1: ['Octopus Form'] });
    const t = settle(passBoth(act(lesson.s, { kind: 'activate', object: lesson.ids.p1[0]!, ability: 0 })));
    expect(lifeOf(t, 'p1')).toBe(22);
    const land = board({ p1: ['Sparring Dummy'], library1: ['Island'] });
    let u = passUntil(passBoth(act(land.s, { kind: 'activate', object: land.ids.p1[0]!, ability: 0 })), decisionIs('may'));
    u = settle(act(u, { kind: 'yes' }));
    expect(handNames(u)).toContain('Island');
  });

  cardTest('The Art of Tea', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', 'Forest', 'Forest'], hand1: ['The Art of Tea'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
    expect(named(t, 'Food')).toHaveLength(1);
  });

  cardTest('True Ancestry', () => {
    const { s, ids } = board({ p1: lands(2, 'Forest'), graveyard1: ['Komodo Rhino'], hand1: ['True Ancestry'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull();
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.graveyard1[0]!]] })));
    expect(handNames(t)).toContain('Komodo Rhino');
    expect(named(t, 'Clue')).toHaveLength(1);
  });
});
