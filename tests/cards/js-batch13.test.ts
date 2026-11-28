/** Jumpstart cards, batch 13: Powerful (1), Iroh, Roku, Zuko, Fire Nation and Musicians packets. */
import { describe, expect } from 'vitest';
import { tapForMana, whyNotCast } from '../../src/engine/engine';
import type { GameState, ObjectId } from '../../src/engine/types';
import { act, decisionIs, lifeOf, passUntil } from '../engine-support';
import { board, cardTest, chars, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');
const attack = (s: GameState, ...attackers: ObjectId[]) => act(toAttack(s), { kind: 'attack', attackers });
const cast = (s: GameState, object: ObjectId, more: object = {}) => passBoth(act(s, { kind: 'cast', object, ...more }));
const ordered = (s: GameState) => (s.decision?.kind === 'triggerOrder' ? act(s, { kind: 'order', triggers: s.decision.triggers }) : s);
const quiet = (s: GameState) => passUntil(ordered(s), (x) => x.decision?.kind === 'triggerOrder' || (x.zones.stack.length === 0 && x.pendingTriggers.length === 0));
const optionNamed = (s: GameState, name: string) => (s.decision as { options: string[] }).options.indexOf(name);

describe('Jumpstart, batch 13', () => {
  cardTest('Firebending Student', () => {
    const { s, ids } = board({ p1: ['Firebending Student'] });
    expect(quiet(attack(s, ids.p1[0]!)).players.p1.combatPool.R).toBe(1);
  });

  cardTest('Mai, Jaded Edge', () => {
    const { s, ids } = board({ p1: ['Mai, Jaded Edge', ...lands(3)] });
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 })));
    expect(chars(t, ids.p1[0]!).keywords).toContain('double strike');
  });

  cardTest('Ty Lee, Artful Acrobat', () => {
    const { s, ids } = board({ p1: ['Ty Lee, Artful Acrobat', 'Mountain'], p2: ['Capital Guard'] });
    let t = passUntil(attack(s, ids.p1[0]!), decisionIs('payOrElse'));
    t = passUntil(act(t, { kind: 'yes' }), decisionIs('triggerTargets'));
    t = quiet(act(t, { kind: 'targets', targets: [[ids.p2[0]!]] }));
    expect(chars(t, ids.p2[0]!).keywords).toContain("can't block");
  });

  cardTest('Fists of Flame', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2)], hand1: ['Fists of Flame'] });
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] }));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 3, keywords: expect.arrayContaining(['trample']) }); // one card drawn
  });

  cardTest('Storm of Memories', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(5)], graveyard1: ['Cunning Maneuver'], hand1: ['Storm of Memories'] });
    let t = passUntil(cast(s, ids.hand1[0]!), decisionIs('castFree'));
    const exiled = named(t, 'Cunning Maneuver', 'p1.exile')[0]!;
    t = settle(act(t, { kind: 'cast', object: exiled, targets: [[ids.p1[0]!]] }));
    expect([chars(t, ids.p1[0]!).power, named(t, 'Clue').length]).toEqual([5, 1]);
    expect(named(t, 'Cunning Maneuver', 'p1.exile')).toHaveLength(1); // exiled instead of the graveyard
    // Storm: a spell cast before it this turn makes one copy.
    const two = board({ p1: lands(6), p2: ['Capital Guard'], hand1: ['Firebending Lesson', 'Storm of Memories'] });
    let u = settle(cast(two.s, two.ids.hand1[0]!, { cost: 0, targets: [[two.ids.p2[0]!]] }));
    u = passUntil(act(u, { kind: 'cast', object: two.ids.hand1[1]! }), (x) => named(x, 'Storm of Memories', 'stack').length === 2);
    expect(named(u, 'Storm of Memories', 'stack')).toHaveLength(2);
  });

  cardTest('Boar-q-pine', () => {
    const { s, ids } = board({ p1: ['Boar-q-pine', ...lands(2)], hand1: ['Cunning Maneuver'] });
    const t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] }));
    expect(t.objects[ids.p1[0]!]!.counters['+1/+1']).toBe(1);
  });

  cardTest('Iroh, Dragon of the West', () => {
    const { s, ids } = board({ p1: ['Iroh, Dragon of the West', 'Capital Guard'] });
    s.objects[ids.p1[1]!]!.counters['+1/+1'] = 1;
    const t = quiet(attack(s, ids.p1[0]!, ids.p1[1]!));
    expect(t.players.p1.combatPool.R).toBe(2); // the Guard has firebending 2
    expect(t.objects[ids.p1[1]!]!.counters['+1/+1']).toBe(2); // mentor
  });

  cardTest('Bolt Bend', () => {
    const { s, ids } = board({ p1: ['Komodo Rhino', ...lands(2)], p2: ['Capital Guard', 'Kindly Customer'], hand1: ['Firebending Lesson', 'Bolt Bend'] });
    let t = act(s, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.p2[0]!]] });
    const lesson = t.zones.stack[0]!;
    expect(whyNotCast(t, 'p1', ids.hand1[1]!)).toBeNull(); // {3} less: a creature with power 4
    t = passUntil(cast(t, ids.hand1[1]!, { targets: [[lesson]] }), decisionIs('choose'));
    t = settle(act(t, { kind: 'option', index: optionNamed(t, 'Kindly Customer') }));
    expect(named(t, 'Kindly Customer', 'p2.graveyard')).toHaveLength(1);
    expect(named(t, 'Capital Guard')).toHaveLength(1);
  });

  cardTest('Fiery Confluence', () => {
    const { s, ids } = board({ p1: lands(4), hand1: ['Fiery Confluence'] });
    let t = cast(s, ids.hand1[0]!);
    for (let i = 0; i < 3; i++) t = act(passUntil(t, decisionIs('choose')), { kind: 'option', index: 1 });
    expect(lifeOf(settle(t), 'p2')).toBe(14);
  });

  cardTest('Founding of Omashu', () => {
    const { s, ids } = board({ p1: lands(3), hand1: ['Founding of Omashu'] });
    expect(named(settle(cast(s, ids.hand1[0]!)), 'Ally')).toHaveLength(2);
  });

  cardTest('Chong and Lily, Nomads', () => {
    const { s, ids } = board({ p1: ['Chong and Lily, Nomads', 'Founding of Omashu'] });
    s.objects[ids.p1[1]!]!.counters.lore = 2;
    let t = passUntil(attack(s, ids.p1[0]!), decisionIs('choose'));
    t = quiet(act(t, { kind: 'options', indices: [1] }));
    expect(chars(t, ids.p1[0]!).power).toBe(5);
  });

  cardTest('The Cave of Two Lovers', () => {
    const { s, ids } = board({ p1: lands(4), hand1: ['The Cave of Two Lovers'] });
    expect(named(settle(cast(s, ids.hand1[0]!)), 'Ally')).toHaveLength(2);
  });

  cardTest('Secret Tunnel', () => {
    const { s, ids } = board({ p1: ['Secret Tunnel', 'Capital Guard', 'Fire Nation Cadets', ...lands(4)] });
    expect(tapForMana(s, ids.p1[0]!)!.makes).toEqual(['C']);
    expect(chars(s, ids.p1[0]!).keywords).toContain("can't be blocked");
    const t = settle(passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 1, targets: [[ids.p1[1]!, ids.p1[2]!]] })));
    expect(chars(t, ids.p1[1]!).keywords).toContain("can't be blocked"); // both Soldiers
  });

  cardTest('Twin Blades', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(3)], hand1: ['Twin Blades'] });
    const t = settle(cast(s, ids.hand1[0]!));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 3, toughness: 3, keywords: expect.arrayContaining(['double strike']) });
  });

  cardTest('Avatar Roku, Firebender', () => {
    const { s, ids } = board({ p1: ['Avatar Roku, Firebender'] });
    const t = quiet(attack(s, ids.p1[0]!));
    expect(t.players.p1.combatPool.R).toBe(6);
  });

  cardTest('Frantic Confrontation', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(3)], hand1: ['Frantic Confrontation'] });
    const t = settle(cast(s, ids.hand1[0]!, { x: 2, targets: [[ids.p1[0]!]] }));
    expect(chars(t, ids.p1[0]!)).toMatchObject({ power: 4, keywords: expect.arrayContaining(['first strike', 'trample']) });
  });

  cardTest('Crescent Island Temple', () => {
    const { s, ids } = board({ p1: lands(4), hand1: ['Crescent Island Temple'] });
    expect(named(settle(cast(s, ids.hand1[0]!)), 'Monk')).toHaveLength(1);
  });

  cardTest('White Lotus Hideout', () => {
    const { s, ids } = board({ p1: ['White Lotus Hideout', 'Plains'], p2: ['Kindly Customer'], hand1: ['Firebending Lesson', 'Fists of Flame', 'Capital Guard'] });
    expect(tapForMana(s, ids.p1[0]!)!.makes).toEqual(['C']); // its coloured mana can't float
    expect(whyNotCast(s, 'p1', ids.hand1[0]!)).toBeNull(); // a Lesson
    expect(whyNotCast(s, 'p1', ids.hand1[2]!)).not.toBeNull(); // red for a creature: no
  });

  cardTest('Zuko, Firebending Master', () => {
    const { s, ids } = board({ p1: ['Zuko, Firebending Master', 'Mountain'], hand1: ['Firebending Lesson'], p2: ['Capital Guard'] });
    let t = quiet(attack(s, ids.p1[0]!));
    expect(t.players.p1.combatPool.R).toBe(0); // no experience yet
    t = settle(act(t, { kind: 'cast', object: ids.hand1[0]!, cost: 0, targets: [[ids.p2[0]!]] }));
    expect(t.players.p1.counters.experience).toBe(1);
  });

  cardTest('Lost in Memories', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(4)], graveyard1: ['Cunning Maneuver'], hand1: ['Lost in Memories'] });
    let t = settle(cast(s, ids.hand1[0]!, { targets: [[ids.p1[0]!]] }));
    expect(chars(t, ids.p1[0]!).power).toBe(3);
    expect(whyNotCast(t, 'p1', ids.graveyard1[0]!)).not.toBeNull();
    t = passUntil(attack(t, ids.p1[0]!), (x) => x.step === 'main2' && x.decision?.kind === 'priority' && x.zones.stack.length === 0);
    expect(lifeOf(t, 'p2')).toBe(17);
    expect(whyNotCast(t, 'p1', ids.graveyard1[0]!)).toBeNull(); // flashback this turn
  });
});
