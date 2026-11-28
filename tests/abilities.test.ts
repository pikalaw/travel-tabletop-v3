/**
 * The M2 gate: rules tests for spells and abilities, triggers (603), layers (613), replacement
 * effects (614–616) and state-based actions (704), each on a small position.
 */
import { describe, expect, it } from 'vitest';
import { characteristics } from '../src/engine/characteristics';
import { legalActions, start, targetOptions, whyNotActivate } from '../src/engine/engine';
import type { GameState, ObjectId, PlayerId } from '../src/engine/types';
import { ABILITY_CARDS } from './ability-cards';
import { act, at, keepBoth, lifeOf, onBattlefield, passUntil, place, refused, setup } from './engine-support';

/** p1's first main phase on turn 1, with these permanents and cards in hand. */
function position(p1: string[] = [], p2: string[] = [], hand1: string[] = [], hand2: string[] = []) {
  let s = passUntil(keepBoth(start({ ...setup(), cards: ABILITY_CARDS }, 11)), at('main1', 'p1'));
  const ids: Record<string, ObjectId[]> = {};
  const put = (p: PlayerId, cards: string[], where: 'battlefield' | 'hand', key: string) => { let got: ObjectId[]; [s, got] = place(s, p, cards, where); ids[key] = got; };
  put('p1', p1, 'battlefield', 'p1'); put('p2', p2, 'battlefield', 'p2'); put('p1', hand1, 'hand', 'h1'); put('p2', hand2, 'hand', 'h2');
  return { s, ids };
}
const chars = (s: GameState, id: ObjectId) => characteristics(s, s.objects[id]!);
const passBoth = (s: GameState) => act(act(s, { kind: 'pass' }), { kind: 'pass' });
const objectsNamed = (s: GameState, name: string) => s.zones.battlefield.filter((id) => s.setup.cards[s.objects[id]!.card]!.name === name);

describe('spells with effects and targets (601, 608)', () => {
  it('a targeted spell resolves on its target', () => {
    const { s: s0, ids } = position(['mountain'], ['bear'], ['shock']);
    const [bear] = ids.p2!, [shock] = ids.h1!;
    expect(targetOptions(s0, 'p1', shock!)[0]!.legal).toEqual(expect.arrayContaining([bear, 'p1', 'p2']));
    expect(refused(s0, { kind: 'cast', object: shock! })).toMatch(/targets/);
    const s = passBoth(act(s0, { kind: 'cast', object: shock!, targets: [[bear!]] }));
    expect(onBattlefield(s, 'Grizzly Bears')).toBe(0);
    expect(s.zones['p1.graveyard']).toHaveLength(1);
  });

  it('608.2b: a spell whose only target is gone does nothing', () => {
    let { s, ids } = position(['mountain', 'mountain'], ['bear'], ['shock', 'shock']);
    const [bear] = ids.p2!, [a, b] = ids.h1!;
    s = act(s, { kind: 'cast', object: a!, targets: [[bear!]] });
    s = act(s, { kind: 'cast', object: b!, targets: [[bear!]] }); // holding priority: the second resolves first
    s = passBoth(s);
    expect(onBattlefield(s, 'Grizzly Bears')).toBe(0);
    s = passBoth(s);
    expect(s.events.map((e) => e.text)).toContain('Shock does nothing: its target is no longer legal');
  });

  it('counters a spell', () => {
    let { s, ids } = position(['mountain'], ['island', 'island', 'island'], ['shock'], ['cancel']);
    s = act(s, { kind: 'cast', object: ids.h1![0]!, targets: [['p2']] });
    s = act(s, { kind: 'pass' });
    const shockOnStack = s.zones.stack[0]!;
    s = act(s, { kind: 'cast', object: ids.h2![0]!, targets: [[shockOnStack]] });
    s = passBoth(passBoth(s));
    expect(lifeOf(s, 'p2')).toBe(20);
    expect(s.zones.stack).toHaveLength(0);
  });

  it('a "may" asks; yes runs the rest, including a discard choice', () => {
    let { s, ids } = position(['island'], [], ['musing']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]! }));
    expect(s.decision).toEqual({ kind: 'may', player: 'p1', text: 'draw two cards, then discard a card' });
    s = act(s, { kind: 'yes' });
    expect(s.decision).toMatchObject({ kind: 'pick', player: 'p1', min: 1, max: 1 });
    const hand = s.zones['p1.hand'];
    s = act(s, { kind: 'pick', cards: [hand[0]!] });
    expect(s.zones['p1.hand']).toHaveLength(hand.length - 1);
    expect(s.decision).toEqual({ kind: 'priority', player: 'p1' });
  });

  it('creates tokens, which cease to exist when they leave the battlefield (111.7)', () => {
    let { s, ids } = position(['plains', 'mountain'], [], ['rally', 'shock']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]! }));
    const soldiers = objectsNamed(s, 'Soldier');
    expect(soldiers).toHaveLength(2);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![1]!, targets: [[soldiers[0]!]] }));
    expect(objectsNamed(s, 'Soldier')).toHaveLength(1);
    expect(s.zones['p1.graveyard'].map((id) => s.objects[id]!.card)).toEqual(['rally', 'shock']); // no token in the graveyard
  });
});

describe('activated abilities (602, 605)', () => {
  it('a mana ability pays without the stack; a summoning-sick creature can\'t tap for mana', () => {
    let { s, ids } = position(['elf'], [], ['bear']);
    expect(legalActions(s)).not.toContainEqual({ kind: 'cast', object: ids.h1![0] }); // {1}{G} from one Elf: no
    [s] = place(s, 'p1', ['forest']);
    s = act(s, { kind: 'cast', object: ids.h1![0]! });
    expect(s.objects[ids.p1![0]!]!.tapped).toBe(true);
    let fresh: ObjectId[];
    [s, fresh] = place(s, 'p1', ['elf']);
    s = structuredClone(s);
    s.objects[fresh[0]!]!.controlledSince = s.turn;
    expect(whyNotActivate(s, 'p1', fresh[0]!, 0)).toMatch(/this turn/);
  });

  it('an ability goes on the stack, can be activated again, and pumps until end of turn', () => {
    let { s, ids } = position(['cadet', 'mountain', 'mountain', 'mountain', 'mountain']);
    const cadet = ids.p1![0]!;
    s = act(s, { kind: 'activate', object: cadet, ability: 0 });
    s = act(s, { kind: 'activate', object: cadet, ability: 0 });
    expect(s.zones.stack).toHaveLength(2);
    s = passBoth(passBoth(s));
    expect(chars(s, cadet).power).toBe(4);
    s = passUntil(s, (x) => x.turn === 2);
    expect(chars(s, cadet).power).toBe(2);
  });

  it('"activate only once each turn"', () => {
    let { s, ids } = position(['pinger', 'mountain', 'mountain']);
    s = passBoth(act(s, { kind: 'activate', object: ids.p1![0]!, ability: 0, targets: [['p2']] }));
    expect(lifeOf(s, 'p2')).toBe(19);
    expect(refused(s, { kind: 'activate', object: ids.p1![0]!, ability: 0, targets: [['p2']] })).toMatch(/once each turn/);
  });
});

describe('triggered abilities (603)', () => {
  it('an enters trigger goes on the stack the next time a player would receive priority', () => {
    let { s, ids } = position(['island', 'island'], [], ['scholar']);
    const hand = s.zones['p1.hand'].length;
    s = act(s, { kind: 'cast', object: ids.h1![0]! });
    s = passBoth(s); // the Scholar resolves and enters; its trigger goes on the stack
    expect(s.zones.stack).toHaveLength(1);
    expect(s.objects[s.zones.stack[0]!]!.ability?.kind).toBe('triggered');
    s = passBoth(s);
    expect(s.zones['p1.hand']).toHaveLength(hand); // cast one, drew one
  });

  it('asks for targets when there is a real choice, and none when there is one', () => {
    let { s, ids } = position(['mountain', 'mountain'], ['bear'], ['sparker']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]! }));
    expect(s.decision).toEqual({ kind: 'triggerTargets', player: 'p1', trigger: 0 });
    s = passBoth(act(s, { kind: 'targets', targets: [['p2']] }));
    expect(lifeOf(s, 'p2')).toBe(19);
  });

  it('603.3d: a trigger with no legal target is removed', () => {
    let { s, ids } = position(['swamp', 'swamp', 'swamp'], [], ['assassin']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]! }));
    expect(s.zones.stack).toHaveLength(0);
    expect(s.decision).toEqual({ kind: 'priority', player: 'p1' });
  });

  it('603.10a: leaves-the-battlefield triggers look back, so creatures dying together see each other', () => {
    let { s } = position(['mourner', 'martyr', 'bear'], ['giant', 'giant', 'giant']);
    s = structuredClone(s);
    for (const id of s.zones.battlefield) if (s.objects[id]!.controller === 'p1') s.objects[id]!.damage = 5; // all three die at once
    s = act(s, { kind: 'pass' });
    // The Mourner sees all three deaths, its own included; the Martyr sees its own.
    expect(s.decision?.kind).toBe('triggerOrder');
    s = act(s, { kind: 'order', triggers: (s.decision as { triggers: number[] }).triggers });
    s = passUntil(s, (x) => x.zones.stack.length === 0 && x.decision?.kind === 'priority');
    expect(lifeOf(s, 'p2')).toBe(17);
    expect(lifeOf(s, 'p1')).toBe(23);
  });

  it('several of one player\'s triggers: identical ones need no ordering, different ones ask', () => {
    const alike = position(['herald', 'herald', 'plains', 'plains'], [], ['cleric']);
    const s1 = passBoth(act(alike.s, { kind: 'cast', object: alike.ids.h1![0]! }));
    expect(s1.zones.stack).toHaveLength(2); // two identical Herald triggers, no question
    const mixed = position(['herald', 'drummer', 'plains', 'plains'], [], ['cleric']);
    let s2 = passBoth(act(mixed.s, { kind: 'cast', object: mixed.ids.h1![0]! }));
    expect(s2.decision).toMatchObject({ kind: 'triggerOrder', player: 'p1' });
    const order = [...(s2.decision as { triggers: number[] }).triggers].reverse();
    s2 = act(s2, { kind: 'order', triggers: order });
    expect(s2.zones.stack).toHaveLength(2);
  });

  it('prowess: casting a noncreature spell pumps the creature', () => {
    let { s, ids } = position(['monk', 'mountain'], [], ['shock']);
    s = act(s, { kind: 'cast', object: ids.h1![0]!, targets: [['p2']] });
    s = passUntil(s, (x) => x.zones.stack.length === 0 && x.decision?.kind === 'priority');
    expect(chars(s, ids.p1![0]!).power).toBe(2);
  });

  it('603.4: an intervening "if" is checked when it triggers and again on resolution', () => {
    let { s } = position(['sentinel', 'bear', 'bear'], ['mountain'], [], ['shock']);
    s = passUntil(s, (x) => x.turn === 2 && x.step === 'upkeep'); // p2's upkeep: not "your" upkeep for the Sentinel
    expect(lifeOf(s, 'p1')).toBe(20);
    s = passUntil(s, (x) => x.turn === 3 && x.zones.stack.length === 1);
    // In response, p2 kills a bear: on resolution p1 controls only two creatures, so no life.
    const bear = s.zones.battlefield.find((id) => s.objects[id]!.card === 'bear')!;
    s = act(s, { kind: 'pass' });
    s = passBoth(act(s, { kind: 'cast', object: s.zones['p2.hand'].find((id) => s.objects[id]!.card === 'shock')!, targets: [[bear]] }));
    s = passBoth(s);
    expect(lifeOf(s, 'p1')).toBe(20);
  });
});

describe('layers (613)', () => {
  it('static abilities apply to whatever matches now, and stop when their source leaves', () => {
    let { s, ids } = position(['anthem', 'bear'], ['mountain'], [], ['shock']);
    expect(chars(s, ids.p1![1]!).power).toBe(3);
    [s] = place(s, 'p1', ['ogre']);
    expect(chars(s, s.zones.battlefield[s.zones.battlefield.length - 1]!).toughness).toBe(3);
    expect(chars(s, ids.p2![0]!).power).toBe(0); // not a creature, nothing to change
  });

  it('a condition is checked continuously: first strike while a Lesson is in the graveyard', () => {
    let { s, ids } = position(['cadet', 'island'], [], ['study']);
    expect(chars(s, ids.p1![0]!).keywords).not.toContain('first strike');
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]! }));
    expect(chars(s, ids.p1![0]!).keywords).toContain('first strike');
  });

  it('7b before 7c: setting base 1/1 keeps +1/+1 from an anthem and counters', () => {
    let { s, ids } = position(['anthem', 'giant', 'island', 'island']);
    const giant = ids.p1![1]!;
    s = structuredClone(s);
    s.objects[giant]!.counters['+1/+1'] = 2;
    [s] = place(s, 'p1', ['frog'], 'hand');
    s = passBoth(act(s, { kind: 'cast', object: s.zones['p1.hand'].find((id) => s.objects[id]!.card === 'frog')!, targets: [[giant]] }));
    expect(chars(s, giant)).toMatchObject({ power: 4, toughness: 4 }); // 1/1, +1/+1 anthem, +2/+2 counters
  });

  it('613.8 dependency: a creature that has lost its abilities grants nothing, whatever the timestamps', () => {
    // p2's Mass Muzzle is older than p1's Sky Lord, so by timestamps alone the Lord's grant would
    // apply after the removal and the Bear would fly.
    let { s } = position([], ['muzzle']);
    let lords: ObjectId[];
    [s, lords] = place(s, 'p1', ['lord', 'bear']);
    const [lord, bear] = lords;
    expect(chars(s, lord!).abilitiesRemoved).toBe(true);
    expect(chars(s, bear!).keywords).not.toContain('flying');
  });

  it('a lost-abilities effect until end of turn, then the grant returns', () => {
    let { s, ids } = position(['lord', 'bear', 'island', 'island'], [], ['frog']);
    const [lord, bear] = ids.p1!;
    expect(chars(s, bear!).keywords).toContain('flying');
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]!, targets: [[lord!]] }));
    expect(chars(s, bear!).keywords).not.toContain('flying');
    expect(chars(s, lord!)).toMatchObject({ power: 1, toughness: 1, abilitiesRemoved: true });
    s = passUntil(s, (x) => x.turn === 2);
    expect(chars(s, bear!).keywords).toContain('flying');
  });
});

describe('replacement effects (614–616)', () => {
  it('enters tapped, and enters with counters', () => {
    let { s, ids } = position(['forest', 'forest'], [], ['tapland', 'hatchling']);
    s = act(s, { kind: 'play', object: ids.h1![0]! });
    expect(s.objects[s.zones.battlefield[s.zones.battlefield.length - 1]!]!.tapped).toBe(true);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![1]! }));
    const h = objectsNamed(s, 'Hatchling')[0]!;
    expect(chars(s, h)).toMatchObject({ power: 2, toughness: 2 }); // a 0/0 survives: the counters are there as it enters
  });

  it('"that many plus one" counters', () => {
    let { s, ids } = position(['ground', 'drummer', 'plains', 'plains'], [], ['cleric']);
    s = passUntil(act(s, { kind: 'cast', object: ids.h1![0]! }), (x) => x.zones.stack.length === 0 && x.decision?.kind === 'priority' && objectsNamed(x, 'Lifelink Cleric').length === 1);
    expect(s.objects[ids.p1![1]!]!.counters['+1/+1']).toBe(2);
  });

  it('a permanent entering with counters gets the extra one too', () => {
    let { s, ids } = position(['ground', 'forest', 'forest'], [], ['hatchling']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]! }));
    expect(s.objects[objectsNamed(s, 'Hatchling')[0]!]!.counters['+1/+1']).toBe(3);
  });

  it('"if it would die this turn, exile it instead"', () => {
    let { s, ids } = position(['mountain', 'mountain'], ['bear'], ['burnout']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]!, targets: [[ids.p2![0]!]] }));
    expect(s.zones['p2.exile']).toHaveLength(1);
    expect(s.zones['p2.graveyard']).toHaveLength(0);
  });

  it('stun counters: the permanent stays tapped for one untap step', () => {
    let { s, ids } = position(['island'], ['bear'], ['stunner']);
    const bear = ids.p2![0]!;
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]!, targets: [[bear]] }));
    s = passUntil(s, (x) => x.turn === 2 && x.step !== 'untap');
    expect(s.objects[bear]!.tapped).toBe(true);
    expect(s.objects[bear]!.counters.stun).toBe(0);
    s = passUntil(s, (x) => x.turn === 4 && x.step !== 'untap');
    expect(s.objects[bear]!.tapped).toBe(false);
  });
});

describe('state-based actions (704)', () => {
  it('704.5f: a creature with 0 toughness dies', () => {
    let { s, ids } = position(['swamp'], ['bear'], ['wither']);
    s = passBoth(act(s, { kind: 'cast', object: ids.h1![0]!, targets: [[ids.p2![0]!]] }));
    expect(onBattlefield(s, 'Grizzly Bears')).toBe(0);
  });

  it('704.5q: +1/+1 and -1/-1 counters cancel', () => {
    let { s, ids } = position(['bear']);
    s = structuredClone(s);
    s.objects[ids.p1![0]!]!.counters = { '+1/+1': 3, '-1/-1': 1 };
    s = act(s, { kind: 'pass' });
    expect(s.objects[ids.p1![0]!]!.counters).toEqual({ '+1/+1': 2, '-1/-1': 0 });
  });
});
