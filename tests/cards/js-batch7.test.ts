/** Jumpstart cards, batch 7: Earth Rumble, Kyoshi, Katara, Adept (2), Adaptive and Soaring (1) packets. */
import { describe, expect } from 'vitest';
import { tapForMana, whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const nameOfCard = (s: GameState, id: ObjectId) => s.setup.cards[s.objects[id]!.card]!.name;
/** Passes priority to the other player's turn and back to p1's next main phase. */
const nextOwnMain = (s: GameState) => passUntil(passUntil(s, (x) => x.active === 'p2'), (x) => x.active === 'p1' && x.step === 'main1' && x.decision?.kind === 'priority' && x.zones.stack.length === 0 && x.pendingTriggers.length === 0);

describe('Jumpstart, batch 7', () => {
  cardTest('Earth Rumble Wrestlers', () => {
    const { s, ids } = board({ p1: ['Earth Rumble Wrestlers'], hand1: ['Forest'] });
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 3 });
    const after = act(s, { kind: 'play', object: ids.hand1[0]! });
    expect(chars(after, ids.p1[0]!)).toMatchObject({ power: 4, keywords: expect.arrayContaining(['trample']) });
  });

  cardTest("Master's Guidance", () => {
    const { s, ids } = board({ p1: ["Master's Guidance", 'Toph, Earthbending Master', 'Uncle Iroh', 'Komodo Rhino'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!, ids.p1[2]!, ids.p1[3]!] }), decisionIs('triggerOrder'));
    t = act(t, { kind: 'order', triggers: (t.decision as { triggers: number[] }).triggers });
    while (t.decision?.kind === 'triggerTargets') {
      const g = t.pendingTriggers[(t.decision as { trigger: number }).trigger]!;
      t = act(t, { kind: 'targets', targets: g.sourceName === "Master's Guidance" ? [[ids.p1[3]!, ids.p1[1]!]] : [[ids.p1[1]!]] });
    }
    t = settle(t);
    expect(t.objects[ids.p1[3]!]!.counters['+1/+1']).toBe(1);
    // End step: a creature with power 4 or more draws a card.
    const hand = t.zones['p1.hand'].length;
    t = passUntil(t, (x) => x.step === 'end' && x.zones.stack.length === 0 && x.decision?.kind === 'priority' && x.zones['p1.hand'].length > hand);
    expect(t.zones['p1.hand']).toHaveLength(hand + 1);
  });

  cardTest('The Boulder, Ready to Rumble', () => {
    const { s, ids } = board({ p1: ['The Boulder, Ready to Rumble', 'Komodo Rhino', 'Forest'] });
    const t = settle(passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), (x) => x.zones.stack.length === 1));
    expect(t.objects[ids.p1[2]!]!.counters['+1/+1']).toBe(2); // the Boulder and the Rhino
  });

  cardTest('Uncle Iroh', () => {
    const { s, ids } = board({ p1: ['Uncle Iroh', 'Forest'], hand1: ['Origin of Metalbending'], p2: ['Bison Whistle'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull(); // {1}{G} for {G}
    expect(chars(s, ids.p1[0]!).keywords).toContain('firebending');
  });

  cardTest('Bosco, Just a Bear', () => {
    const { s, ids } = board({ p1: ['Uncle Iroh', ...lands(8, 'Forest')], hand1: ['Bosco, Just a Bear'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const foods = named(t, 'Food');
    expect(foods).toHaveLength(2); // Iroh and Bosco
    const bosco = named(t, 'Bosco, Just a Bear')[0]!;
    expect(refused(t, { kind: 'activate', object: bosco, ability: 0 })).toMatch(/sacrifice/);
    t = settle(passBoth(act(t, { kind: 'activate', object: bosco, ability: 0, sacrificing: [foods[0]!] })));
    expect(t.objects[bosco]!.counters['+1/+1']).toBe(2);
    expect(named(t, 'Food')).toHaveLength(1);
    expect(chars(t, bosco).keywords).toContain('trample');
  });

  cardTest('The Earth King', () => {
    const { s, ids } = board({ p1: lands(4, 'Forest'), hand1: ['The Earth King'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const bear = named(t, 'Bear')[0]!;
    t = structuredClone(t);
    t.objects[bear]!.controlledSince = -1; // ready to attack
    t = passUntil(act(toAttack(t), { kind: 'attack', attackers: [bear] }), decisionIs('pick'));
    expect(t.decision).toMatchObject({ max: 1 });
    t = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[0]!] }));
    expect(named(t, 'Plains')).toHaveLength(1);
  });

  cardTest('Avatar Kyoshi, Earthbender', () => {
    const { s, ids } = board({ p1: ['Avatar Kyoshi, Earthbender', 'Forest'] });
    expect(chars(s, ids.p1[0]!).keywords).toContain('hexproof');
    const t = settle(passUntil(s, (x) => x.step === 'beginCombat' && x.zones.stack.length === 1));
    expect(t.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(8);
    expect(t.objects[ids.p1[1]!]!.tapped).toBe(false);
  });

  cardTest('Cracked Earth Technique', () => {
    const { s, ids } = board({ p1: lands(5, 'Forest'), hand1: ['Cracked Earth Technique'] });
    const land = ids.p1[0]!;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[land], [land]] })));
    expect(t.objects[land]!.counters['+1/+1']).toBe(6);
    expect(lifeOf(t, 'p1')).toBe(23);
  });

  cardTest('Cycle of Renewal', () => {
    const { s, ids } = board({ p1: lands(3, 'Forest'), hand1: ['Cycle of Renewal'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    expect(t.decision).toMatchObject({ text: 'Sacrifice a land', min: 1, max: 1 });
    t = passUntil(act(t, { kind: 'pick', cards: [ids.p1[0]!] }), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: (t.decision as { options: ObjectId[] }).options.slice(0, 2) }));
    expect(named(t, 'Forest')).toHaveLength(2);
    expect(named(t, 'Plains').map((id) => t.objects[id]!.tapped)).toEqual([true, true]);
  });

  cardTest('Tectonic Split', () => {
    const { s, ids } = board({ p1: lands(7, 'Forest'), hand1: ['Tectonic Split'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]! })).toMatch(/sacrifice/);
    // Half of seven lands, rounded up: four. The six it taps to pay aren't the ones it sacrifices, so choose the untapped one plus three.
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, sacrificing: ids.p1.slice(0, 4) })));
    expect(named(t, 'Forest')).toHaveLength(3);
    expect(tapForMana(t, named(t, 'Forest')[0]!)).toMatchObject({ n: 3 });
  });

  cardTest('Consider', () => {
    const { s, ids } = board({ p1: ['Island'], hand1: ['Consider'] });
    const t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('arrange'));
    expect(t.decision).toMatchObject({ to: 'graveyard' });
    const hand = t.zones['p1.hand'].length;
    const u = settle(act(t, { kind: 'arrange', top: [], away: (t.decision as { cards: ObjectId[] }).cards }));
    expect(u.zones['p1.graveyard']).toHaveLength(2); // the surveilled card and Consider
    expect(u.zones['p1.hand']).toHaveLength(hand + 1);
  });

  cardTest('Gran-Gran', () => {
    const { s, ids } = board({ p1: ['Gran-Gran', 'Island'], graveyard1: ['Consider', 'Octopus Form', 'Boomerang Basics', 'Origin of Metalbending'], hand1: ['Frantic Search'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBe('Not enough mana of the right colours'); // {2}{U} less {1} still needs two
    const t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), (x) => x.zones.stack.length === 1);
    const u = passUntil(passBoth(t), decisionIs('pick'));
    expect(u.decision).toMatchObject({ min: 1, max: 1, done: 'Discard' });
  });

  cardTest('Katara, Waterbending Master', () => {
    let { s, ids } = board({ p1: ['Katara, Waterbending Master', 'Island'], hand1: ['Octopus Form'] });
    // An instant on Claire's turn: an experience counter.
    s = passUntil(s, (x) => x.active === 'p2' && x.step === 'main1' && x.decision?.kind === 'priority' && x.decision.player === 'p2');
    s = act(s, { kind: 'pass' });
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(s.players.p1.counters.experience).toBe(1);
    s = nextOwnMain(s);
    const t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), decisionIs('may'));
    const hand = t.zones['p1.hand'].length;
    const u = passUntil(act(t, { kind: 'yes' }), decisionIs('pick'));
    expect(u.zones['p1.hand']).toHaveLength(hand + 1);
  });

  cardTest('Octopus Form', () => {
    let { s, ids } = board({ p1: ['Komodo Rhino', 'Island'], hand1: ['Octopus Form'] });
    s = structuredClone(s);
    s.objects[ids.p1[0]!]!.tapped = true;
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 6, toughness: 3, keywords: expect.arrayContaining(['hexproof']) });
    expect(t.objects[ids.p1[0]!]!.tapped).toBe(false);
  });

  cardTest("Sokka's Haiku", () => {
    const { s, ids } = board({ p1: lands(5, 'Island'), p2: lands(2), hand1: ["Sokka's Haiku"], hand2: ['Lightning Strike'] });
    let t = passUntil(s, (x) => x.decision?.kind === 'priority' && x.decision.player === 'p2');
    t = act(act(t, { kind: 'cast', object: ids.hand2[0]!, targets: [['p1']] }), { kind: 'pass' });
    const spell = t.zones.stack[0]!;
    const hand = t.zones['p1.hand'].length;
    t = settle(passBoth(act(t, { kind: 'cast', object: ids.hand1[0]!, targets: [[spell], [ids.p1[0]!]] })));
    expect(lifeOf(t, 'p1')).toBe(20);
    expect(t.zones['p1.hand']).toHaveLength(hand); // drew one, cast one
    expect(t.zones['p1.graveyard']).toHaveLength(4); // the Haiku and three milled
    expect(t.objects[ids.p1[0]!]!.tapped).toBe(false);
  });

  cardTest('Lost Days', () => {
    const { s, ids } = board({ p1: lands(5, 'Island'), p2: ['Komodo Rhino'], hand1: ['Lost Days'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })), decisionIs('choose'));
    expect(t.decision).toMatchObject({ player: 'p2', options: ['Second from the top', 'On the bottom'] }); // the owner chooses
    t = settle(act(t, { kind: 'option', index: 0 }));
    const lib = t.zones['p2.library'];
    expect(nameOfCard(t, lib[lib.length - 2]!)).toBe('Komodo Rhino');
    expect(named(t, 'Clue').map((id) => t.objects[id]!.controller)).toEqual(['p1']);
  });

  cardTest('Nightmares and Daydreams', () => {
    let { s, ids } = board({ p1: lands(6, 'Island'), hand1: ['Nightmares and Daydreams', 'Consider'] });
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const saga = named(s, 'Nightmares and Daydreams')[0]!;
    expect(s.objects[saga]!.counters.lore).toBe(1);
    // Chapter I: casting an instant makes target player mill its mana value.
    s = act(s, { kind: 'cast', object: ids.hand1[1]! });
    expect(s.decision?.kind).toBe('triggerTargets');
    s = act(s, { kind: 'targets', targets: [['p2']] });
    s = passUntil(passBoth(s), decisionIs('arrange')); // the mill resolved; Consider surveils
    s = settle(act(s, { kind: 'arrange', top: (s.decision as { cards: ObjectId[] }).cards, away: [] }));
    expect(s.zones['p2.graveyard']).toHaveLength(1);
    // Three more lore counters, one each main phase: chapter IV draws, then the Saga is sacrificed.
    const t = passUntil(s, (x) => x.turn === 7 && x.step === 'main1' && x.zones.stack.length === 0 && x.decision?.kind === 'priority' && x.pendingTriggers.length === 0, 2000);
    expect(named(t, 'Nightmares and Daydreams')).toHaveLength(0);
    expect(t.events.some((e) => e.text.includes('Nightmares and Daydreams is sacrificed'))).toBe(true);
  });

  cardTest('Professor Zei, Anthropologist', () => {
    const { s, ids } = board({ p1: ['Professor Zei, Anthropologist', 'Island'], hand1: ['Consider', 'Island'], graveyard1: ['Octopus Form'] });
    expect(refused(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })).toMatch(/discard/);
    let t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, discarding: [ids.hand1[1]!] })));
    expect(t.zones['p1.graveyard']).toHaveLength(2);
    const zei = board({ p1: ['Professor Zei, Anthropologist', 'Island'], graveyard1: ['Octopus Form'] });
    t = settle(passBoth(act(zei.s, { kind: 'activate', object: zei.ids.p1[0]!, ability: 1, targets: [[zei.ids.graveyard1[0]!]] })));
    expect(t.zones['p1.hand'].map((id) => nameOfCard(t, id))).toContain('Octopus Form');
    expect(named(t, 'Professor Zei, Anthropologist')).toHaveLength(0);
  });

  cardTest('Teo, Spirited Glider', () => {
    const { s, ids } = board({ p1: ['Teo, Spirited Glider'], hand1: ['Consider'] });
    let t = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }), (x) => x.zones.stack.length === 1);
    t = passUntil(passBoth(t), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [ids.hand1[0]!] })); // a nonland card: the counter goes on Teo, the one target
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Boomerang Basics', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', 'Island', 'Island'], p2: ['Bison Whistle'], hand1: ['Boomerang Basics', 'Boomerang Basics'] });
    const hand = s.zones['p1.hand'].length;
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    expect(t.zones['p1.hand']).toHaveLength(hand + 1); // the Rhino back, a card drawn, one Basics gone
    t = settle(passBoth(act(t, { kind: 'cast', object: ids.hand1[1]!, targets: [[ids.p2[0]!]] })));
    expect(t.zones['p1.hand']).toHaveLength(hand); // no draw for the opponent's permanent
    expect(t.zones['p2.hand'].map((id) => nameOfCard(t, id))).toContain('Bison Whistle');
  });

  cardTest('Frantic Search', () => {
    const { s, ids } = board({ p1: lands(3, 'Island'), hand1: ['Frantic Search', 'Consider', 'Island'] });
    let t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })), decisionIs('pick'));
    t = passUntil(act(t, { kind: 'pick', cards: [ids.hand1[1]!, ids.hand1[2]!] }), decisionIs('pick'));
    expect(t.decision).toMatchObject({ text: 'Untap up to three lands', min: 0, max: 3 });
    t = settle(act(t, { kind: 'pick', cards: ids.p1 }));
    expect(ids.p1.map((id) => t.objects[id]!.tapped)).toEqual([false, false, false]);
  });

  cardTest('Princess Yue', () => {
    const { s, ids } = board({ p1: ['Princess Yue', ...lands(5, 'Swamp')], hand1: ['Deadly Precision'] });
    const t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.p1[0]!]] })));
    const moon = t.zones.battlefield.find((id) => chars(t, id).name === 'Moon')!;
    expect(chars(t, moon)).toMatchObject({ types: ['Land'], subtypes: [] });
    expect(t.objects[moon]!.tapped).toBe(true);
    expect(tapForMana(t, moon)).toMatchObject({ makes: ['C'] });
  });

  cardTest('The Blue Spirit', () => {
    let { s, ids } = board({ p1: ['The Blue Spirit', ...lands(4, 'Island')], hand1: ['Forecasting Fortune Teller', 'Messenger Hawk'] });
    s = passUntil(s, (x) => x.step === 'beginCombat' && x.decision?.kind === 'priority');
    const hand = s.zones['p1.hand'].length;
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    s = settle(act(s, { kind: 'order', triggers: (s.decision as { triggers: number[] }).triggers })); // the Blue Spirit's and the Teller's
    expect(s.zones['p1.hand']).toHaveLength(hand); // cast one, drew one: it entered during combat
    expect(whyNotCast(s, 'p1', ids.hand1[1]!)).toMatch(/main phase/); // only the first creature spell
  });

  cardTest('Forecasting Fortune Teller', () => {
    const { s, ids } = board({ p1: lands(2, 'Island'), hand1: ['Forecasting Fortune Teller'] });
    expect(named(settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }))), 'Clue')).toHaveLength(1);
  });

  cardTest('Messenger Hawk', () => {
    const { s, ids } = board({ p1: ['Messenger Hawk', 'Clue', 'Clue', ...lands(4, 'Island')] });
    expect(chars(s, ids.p1[0]!).power).toBe(1);
    let t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[1]!, ability: 0 })));
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[2]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).power).toBe(3);
  });

  cardTest('The Mechanist, Aerial Artisan', () => {
    const { s, ids } = board({ p1: ['The Mechanist, Aerial Artisan', 'Island'], hand1: ['Octopus Form'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })));
    const clue = named(t, 'Clue')[0]!;
    t = settle(passBoth(act(t, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[clue]] })));
    expect(chars(t, clue)).toMatchObject({ power: 3, toughness: 1, types: expect.arrayContaining(['Artifact', 'Creature']), keywords: ['flying'] });
  });
});
