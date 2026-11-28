/** Jumpstart cards, batch 6: Reinforced, Earthbending, Toph, At the Zoo and Earth Kingdom packets. */
import { describe, expect } from 'vitest';
import { tapForMana, whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil, place, refused } from '../engine-support';
import { board, cardTest, chars, idOf, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const toBlock = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'blockers');
/** A copy of the state with counters put on an object directly, for a starting position. */
function withCounters(s: GameState, id: ObjectId, kind: string, n: number): GameState {
  const t = structuredClone(s);
  t.objects[id]!.counters[kind] = n;
  return t;
}
/** Attacks with these creatures, nobody blocks, and play runs to the end of combat. */
const attackUnblocked = (s: GameState, attackers: ObjectId[]) => settle(passUntil(act(toAttack(s), { kind: 'attack', attackers }), (x) => x.step === 'end' || x.step === 'main2' || x.decision?.kind !== 'priority' && x.decision?.kind !== 'blockers'));

describe('Jumpstart, batch 6', () => {
  cardTest('Clue', () => {
    const { s, ids } = board({ p1: ['Clue', ...lands(2, 'Plains')] });
    const hand = s.zones['p1.hand'].length;
    const after = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(after.zones['p1.hand']).toHaveLength(hand + 1);
    expect(named(after, 'Clue')).toHaveLength(0);
  });

  cardTest('Food', () => {
    const { s, ids } = board({ p1: ['Food', ...lands(2, 'Plains')] });
    const after = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(lifeOf(after, 'p1')).toBe(23);
  });

  cardTest('Callous Inspector', () => {
    const { s, ids } = board({ p1: ['Callous Inspector', ...lands(5, 'Swamp')], hand1: ['Deadly Precision'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.p1[0]!]] })));
    expect(lifeOf(after, 'p1')).toBe(19);
    expect(named(after, 'Clue')).toHaveLength(1);
  });

  cardTest('Deadly Precision', () => {
    const { s, ids } = board({ p1: ['Callous Inspector', 'Swamp'], p2: ['Capital Guard'], hand1: ['Deadly Precision'] });
    const dp = ids.hand1[0]!, guard = ids.p2[0]!, inspector = ids.p1[0]!;
    expect(refused(s, { kind: 'cast', object: dp, targets: [[guard]] })).toMatch(/additional cost/);
    expect(refused(s, { kind: 'cast', object: dp, cost: 0, targets: [[guard]] })).toMatch(/mana/);
    // With one creature to sacrifice, there's nothing to choose: it goes.
    const after = settle(passBoth(act(s, { kind: 'cast', object: dp, cost: 1, targets: [[guard]] })));
    expect(after.zones['p1.graveyard'].map((id) => after.setup.cards[after.objects[id]!.card]!.name)).toContain('Callous Inspector');
    const two = board({ p1: ['Callous Inspector', 'Komodo Rhino', 'Swamp'], p2: ['Capital Guard'], hand1: ['Deadly Precision'] });
    expect(refused(two.s, { kind: 'cast', object: two.ids.hand1[0]!, cost: 1, targets: [[two.ids.p2[0]!]] })).toMatch(/sacrifice/);
    expect(inspector).toBeDefined();
    expect(named(after, 'Capital Guard')).toHaveLength(0);
    expect(named(after, 'Callous Inspector')).toHaveLength(0);
  });

  cardTest('Fire Nation Salvagers', () => {
    const cast = board({ p1: lands(5, 'Swamp'), hand1: ['Fire Nation Salvagers'] });
    const entered = settle(passBoth(act(cast.s, { kind: 'cast', object: cast.ids.hand1[0]! })));
    expect(entered.objects[named(entered, 'Fire Nation Salvagers')[0]!]!.counters['+1/+1']).toBe(1); // itself, the only target
    let { s, ids } = board({ p1: ['Fire Nation Salvagers', 'Capital Guard'], hand2: ['Komodo Rhino'] });
    s = withCounters(s, ids.p1[1]!, '+1/+1', 1);
    let gone: ObjectId[];
    [s, gone] = place(s, 'p2', [idOf('Komodo Rhino')], 'graveyard');
    s = attackUnblocked(s, [ids.p1[0]!, ids.p1[1]!]);
    expect(s.zones['p2.graveyard']).not.toContain(gone[0]);
    const rhino = named(s, 'Komodo Rhino')[0]!;
    expect(s.objects[rhino]!.controller).toBe('p1');
  });

  cardTest('Zuko, Seeking Honor', () => {
    const { s, ids } = board({ p1: ['Zuko, Seeking Honor', ...lands(2)], hand1: ['Lightning Strike'] });
    const zuko = ids.p1[0]!;
    let after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [['p2']] })));
    expect(chars(after, zuko).keywords).toContain('first strike');
    after = attackUnblocked(after, [zuko]);
    expect(after.objects[zuko]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Fatal Fissure', () => {
    const { s, ids } = board({ p1: lands(8, 'Swamp'), p2: ['Capital Guard'], hand1: ['Fatal Fissure', 'Deadly Precision'] });
    const guard = ids.p2[0]!;
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[guard]] })));
    t = passBoth(act(t, { kind: 'cast', object: ids.hand1[1]!, cost: 0, targets: [[guard]] }));
    t = passUntil(t, decisionIs('triggerTargets'));
    const land = ids.p1[7]!;
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[land]] })));
    expect(chars(t, land).types).toContain('Creature');
    expect(t.objects[land]!.counters['+1/+1']).toBe(4);
  });

  cardTest('Earth Kingdom General', () => {
    const { s, ids } = board({ p1: lands(6, 'Forest'), hand1: ['Earth Kingdom General', 'Origin of Metalbending'] });
    let t = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    t = passUntil(t, decisionIs('triggerTargets'));
    t = passUntil(act(t, { kind: 'targets', targets: [[ids.p1[5]!]] }), decisionIs('may'));
    expect(t.decision).toMatchObject({ kind: 'may', text: 'gain that much life' });
    t = settle(act(t, { kind: 'yes' }));
    expect(lifeOf(t, 'p1')).toBe(22);
    // Once each turn: a second time, nothing is asked.
    const general = named(t, 'Earth Kingdom General')[0]!;
    t = settle(passBoth(act(t, { kind: 'cast', object: ids.hand1[1]!, modes: [1], targets: [[general]] })));
    expect(t.objects[general]!.counters['+1/+1']).toBe(1);
    expect(lifeOf(t, 'p1')).toBe(22);
  });

  cardTest('Earthbender Ascension', () => {
    const cast = board({ p1: lands(3, 'Forest'), hand1: ['Earthbender Ascension'] });
    let t = passUntil(passBoth(act(cast.s, { kind: 'cast', object: cast.ids.hand1[0]! })), decisionIs('triggerTargets'));
    t = passUntil(passBoth(act(t, { kind: 'targets', targets: [[cast.ids.p1[0]!]] })), decisionIs('pick'));
    t = settle(act(t, { kind: 'pick', cards: [(t.decision as { options: ObjectId[] }).options[0]!] }));
    expect(named(t, 'Plains').map((id) => t.objects[id]!.tapped)).toEqual([true]); // fetched, tapped
    expect(t.objects[cast.ids.p1[0]!]!.counters['+1/+1']).toBe(2);
    // Landfall: a quest counter; at four, the reflexive trigger pumps a creature.
    let { s, ids } = board({ p1: ['Earthbender Ascension', 'Komodo Rhino'], hand1: ['Forest'] });
    s = withCounters(s, ids.p1[0]!, 'quest', 3);
    s = settle(act(s, { kind: 'play', object: ids.hand1[0]! }));
    expect(s.objects[ids.p1[0]!]!.counters.quest).toBe(4);
    expect(s.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(1);
    expect(chars(s, ids.p1[1]!).keywords).toContain('trample');
  });

  cardTest('Inspiring Call', () => {
    let { s, ids } = board({ p1: ['Komodo Rhino', 'Capital Guard', ...lands(3, 'Forest')], hand1: ['Inspiring Call'] });
    s = withCounters(s, ids.p1[0]!, '+1/+1', 1);
    const hand = s.zones['p1.hand'].length;
    s = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(s.zones['p1.hand']).toHaveLength(hand); // one drawn, the spell gone
    expect(chars(s, ids.p1[0]!).keywords).toContain('indestructible');
    expect(chars(s, ids.p1[1]!).keywords).not.toContain('indestructible');
  });

  cardTest('Rumble Arena', () => {
    const played = board({ hand1: ['Rumble Arena'] });
    const t = act(played.s, { kind: 'play', object: played.ids.hand1[0]! });
    expect(passUntil(t, decisionIs('arrange')).decision).toMatchObject({ kind: 'arrange' });
    // {1}, {T}: any colour, paid with another land's mana: Mountain, Mountain and the Arena cast {1}{G/W}.
    const { s, ids } = board({ p1: ['Rumble Arena', 'Mountain', 'Mountain'], hand1: ['Stand United'], p2: ['Capital Guard'] });
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull();
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })));
    expect(chars(after, ids.p2[0]!).power).toBe(4);
    expect(after.objects[ids.p1[0]!]!.tapped).toBe(true);
  });

  cardTest('Solid Ground', () => {
    const { s, ids } = board({ p1: ['Solid Ground', 'Komodo Rhino', ...lands(2, 'Forest')], hand1: ['Origin of Metalbending'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [1], targets: [[ids.p1[1]!]] })));
    expect(after.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(2);
  });

  cardTest('Tale of Katara and Toph', () => {
    const { s, ids } = board({ p1: ['Tale of Katara and Toph', 'Komodo Rhino'] });
    const after = attackUnblocked(s, [ids.p1[1]!]);
    expect(after.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Kyoshi Warrior Exemplars', () => {
    const big = board({ p1: ['Kyoshi Warrior Exemplars', 'Capital Guard', ...lands(8, 'Forest')] });
    let t = passUntil(act(toAttack(big.s), { kind: 'attack', attackers: [big.ids.p1[0]!] }), (x) => x.zones.stack.length === 1);
    t = passBoth(t);
    expect(chars(t, big.ids.p1[1]!).power).toBe(4);
    const small = board({ p1: ['Kyoshi Warrior Exemplars', 'Capital Guard', ...lands(7, 'Forest')] });
    const u = act(toAttack(small.s), { kind: 'attack', attackers: [small.ids.p1[0]!] });
    expect(u.pendingTriggers).toHaveLength(0);
    expect(u.zones.stack).toHaveLength(0);
  });

  cardTest('Origin of Metalbending', () => {
    const { s, ids } = board({ p1: lands(2, 'Forest'), p2: ['Bison Whistle'], hand1: ['Origin of Metalbending'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0], targets: [[ids.p2[0]!]] })));
    expect(named(after, 'Bison Whistle')).toHaveLength(0);
  });

  cardTest('Toph, Earthbending Master', () => {
    const { s, ids } = board({ p1: ['Toph, Earthbending Master', 'Forest'], hand1: ['Forest'] });
    let t = settle(act(s, { kind: 'play', object: ids.hand1[0]! }));
    expect(t.players.p1.counters.experience).toBe(1);
    t = passUntil(act(toAttack(t), { kind: 'attack', attackers: [ids.p1[0]!] }), decisionIs('triggerTargets'));
    t = settle(passBoth(act(t, { kind: 'targets', targets: [[ids.p1[1]!]] })));
    expect(t.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(1);
    expect(chars(t, ids.p1[1]!).types).toContain('Creature');
  });

  cardTest('Animal Attendant', () => {
    const { s, ids } = board({ p1: ['Animal Attendant', 'Forest', 'Forest'], hand1: ['Elephant-Mandrill'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const mandrill = named(after, 'Elephant-Mandrill')[0]!;
    expect(after.objects[mandrill]!.counters['+1/+1']).toBe(1);
    expect(after.objects[ids.p1[0]!]!.tapped).toBe(true);
  });

  cardTest('Bison Whistle', () => {
    const { s, ids } = board({ p1: ['Bison Whistle', 'Forest'], library1: ["Appa, Aang's Companion"] });
    let t = passUntil(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })), decisionIs('choose'));
    expect(t.decision).toMatchObject({ options: ['Put it onto the battlefield', 'Reveal it and put it into your hand', 'Leave it on top'] });
    t = settle(act(t, { kind: 'option', index: 0 }));
    expect(named(t, "Appa, Aang's Companion")).toHaveLength(1);
  });

  cardTest('Diligent Zookeeper', () => {
    const { s, ids } = board({ p1: ['Diligent Zookeeper', 'Elephant-Mandrill', 'Capital Guard'] });
    expect(chars(s, ids.p1[1]!)).toMatchObject({ power: 5, toughness: 4 }); // Elephant Monkey: +2/+2
    expect(chars(s, ids.p1[2]!)).toMatchObject({ power: 2, toughness: 2 }); // Human: none
    expect(chars(s, ids.p1[0]!)).toMatchObject({ power: 4, toughness: 4 });
  });

  cardTest('Elephant-Mandrill', () => {
    const { s, ids } = board({ p1: lands(3, 'Forest'), hand1: ['Elephant-Mandrill'] });
    let t = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(named(t, 'Food').map((id) => t.objects[id]!.controller).sort()).toEqual(['p1', 'p2']);
    t = passUntil(t, (x) => x.step === 'beginCombat' && x.zones.stack.length === 1);
    t = passBoth(t);
    expect(chars(t, named(t, 'Elephant-Mandrill')[0]!).power).toBe(4);
  });

  cardTest('Allies at Last', () => {
    const { s, ids } = board({ p1: ['Great Divide Guide', 'Capital Guard', 'Forest'], p2: ['Komodo Rhino'], hand1: ['Allies at Last'] });
    // Affinity for Allies: one Ally makes it {1}{G}; the Guide is an Ally that taps for any colour, but it's targeted, not tapped, here.
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull();
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!, ids.p1[1]!], [ids.p2[0]!]] })));
    expect(named(after, 'Komodo Rhino')).toHaveLength(0); // 2 + 2 damage to a 5/2
  });

  cardTest("Descendants' Path", () => {
    const { s } = board({ p1: ["Descendants' Path", 'Capital Guard'], library1: ['Callous Inspector'] });
    let t = passUntil(s, decisionIs('choose'));
    expect(t.decision).toMatchObject({ options: ['Cast it without paying its mana cost', 'Put it on the bottom'] });
    t = settle(act(t, { kind: 'option', index: 0 }));
    expect(named(t, 'Callous Inspector')).toHaveLength(1);
    // A card that shares no creature type goes to the bottom without a question.
    const other = board({ p1: ["Descendants' Path", 'Capital Guard'], library1: ['Komodo Rhino'] });
    const u = passUntil(other.s, (x) => x.step === 'upkeep' && x.active === 'p1' && x.zones.stack.length === 0 && x.turn === 3 && x.decision?.kind === 'priority');
    expect(u.setup.cards[u.objects[u.zones['p1.library'][0]!]!.card]!.name).toBe('Komodo Rhino'); // the bottom
  });

  cardTest('Great Divide Guide', () => {
    const { s, ids } = board({ p1: ['Great Divide Guide', 'Forest', 'Capital Guard'] });
    expect(tapForMana(s, ids.p1[1]!)!.makes).toEqual(expect.arrayContaining(['W', 'U', 'B', 'R', 'G']));
    expect(tapForMana(s, ids.p1[0]!)!.makes).toHaveLength(5); // an Ally itself
    expect(tapForMana(s, ids.p1[2]!)).toBeNull();
  });

  cardTest('Walltop Sentries', () => {
    const { s, ids } = board({ p1: ['Walltop Sentries', ...lands(5, 'Swamp')], graveyard1: ['Origin of Metalbending'], hand1: ['Deadly Precision'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.p1[0]!]] })));
    expect(lifeOf(after, 'p1')).toBe(22);
  });

  cardTest('Foggy Swamp Vinebender', () => {
    const { s, ids } = board({ p1: ['Foggy Swamp Vinebender', ...lands(5, 'Forest')], p2: ['Capital Guard', 'Komodo Rhino'] });
    const t = toBlock(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] }));
    expect(refused(t, { kind: 'block', blocks: [{ blocker: ids.p2[0]!, attacker: ids.p1[0]! }] })).toMatch(/can't block/);
    expect(act(t, { kind: 'block', blocks: [{ blocker: ids.p2[1]!, attacker: ids.p1[0]! }] }).decision?.kind).not.toBe('blockers');
    const after = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(after.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Kyoshi Battle Fan', () => {
    const { s, ids } = board({ p1: lands(2, 'Plains'), hand1: ['Kyoshi Battle Fan'] });
    const after = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    const ally = named(after, 'Ally')[0]!;
    expect(after.objects[named(after, 'Kyoshi Battle Fan')[0]!]!.attachedTo).toBe(ally);
    expect(chars(after, ally)).toMatchObject({ power: 2, toughness: 1 });
  });

  cardTest('Stand United', () => {
    const { s, ids } = board({ p1: ['Great Divide Guide', 'Capital Guard', ...lands(4, 'Forest')], hand1: ['Stand United', 'Stand United'] });
    const t = passUntil(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p1[0]!]] })), decisionIs('arrange'));
    expect(t.decision).toMatchObject({ kind: 'arrange', to: 'bottom' });
    expect(chars(t, ids.p1[0]!).power).toBe(4);
    const u = settle(passBoth(act(s, { kind: 'cast', object: ids.hand1[1]!, targets: [[ids.p1[1]!]] })));
    expect(chars(u, ids.p1[1]!).power).toBe(4);
  });
});
