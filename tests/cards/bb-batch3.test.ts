/** Beginner Box cards, batch 3: chosen colours, modes, scry, searches and landcycling, X, abilities from hand and graveyard. */
import { describe, expect } from 'vitest';
import { legalActions, manaSources } from '../../src/engine/engine';
import type { GameState } from '../../src/engine/types';
import { act, lifeOf, passUntil, refused } from '../engine-support';
import { board, cardTest, chars, idOf, lands, named, passBoth, settle } from './harness';

const toAttack = (s: GameState) => passUntil(s, (x) => x.decision?.kind === 'attackers');

function thriving(name: string, own: string, other: string) {
  let { s, ids } = board({ hand1: [name] });
  s = act(s, { kind: 'play', object: ids.hand1[0]! });
  expect(s.decision).toMatchObject({ kind: 'chooseColor', player: 'p1' });
  expect((s.decision as { options: string[] }).options).not.toContain(own);
  s = act(s, { kind: 'color', color: other as 'W' });
  const land = named(s, name)[0]!;
  expect(s.objects[land]).toMatchObject({ tapped: true, chosenColor: other });
  s = structuredClone(s); s.objects[land]!.tapped = false;
  expect([...manaSources(s, 'p1').find((m) => m.id === land)!.makes].sort()).toEqual([own, other].sort());
}

describe('Beginner Box, batch 3', () => {
  cardTest('Thriving Bluff', () => thriving('Thriving Bluff', 'R', 'W'));
  cardTest('Thriving Grove', () => thriving('Thriving Grove', 'G', 'U'));
  cardTest('Thriving Heath', () => thriving('Thriving Heath', 'W', 'B'));
  cardTest('Thriving Isle', () => thriving('Thriving Isle', 'U', 'R'));
  cardTest('Thriving Moor', () => thriving('Thriving Moor', 'B', 'G'));

  cardTest('Heartless Act', () => {
    let { s, ids } = board({ p1: lands(2, 'Swamp'), p2: ['Komodo Rhino', 'Gilacorn'], hand1: ['Heartless Act'] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, targets: [[ids.p2[0]!]] })).toMatch(/modes/);
    s = structuredClone(s); s.objects[ids.p2[1]!]!.counters['+1/+1'] = 2;
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0], targets: [[ids.p2[1]!]] })).toMatch(/legal target/);
    const destroy = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0], targets: [[ids.p2[0]!]] }));
    expect(named(destroy, 'Komodo Rhino')).toHaveLength(0);
    const remove = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [1], targets: [[ids.p2[1]!]] }));
    expect(remove.objects[ids.p2[1]!]!.counters['+1/+1']).toBe(0);
  });

  cardTest('Azula Always Lies', () => {
    const { s, ids } = board({ p1: ['Capital Guard', ...lands(2, 'Swamp')], p2: ['Gilacorn'], hand1: ['Azula Always Lies'] });
    const both = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, modes: [0, 1], targets: [[ids.p2[0]!], [ids.p1[0]!]] }));
    expect(named(both, 'Gilacorn')).toHaveLength(0);
    expect(chars(both, ids.p1[0]!).power).toBe(3);
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, modes: [], targets: [] })).toMatch(/1 to 2 modes/);
  });

  cardTest('Glider Kids', () => {
    const { s, ids } = board({ p1: lands(3, 'Plains'), hand1: ['Glider Kids'] });
    let after = passBoth(passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! })));
    expect(after.decision).toMatchObject({ kind: 'arrange', player: 'p1', to: 'bottom' });
    const [card] = (after.decision as { cards: string[] }).cards;
    after = settle(act(after, { kind: 'arrange', top: [], away: [card!] }));
    expect(after.zones['p1.library'][0]).toBe(card); // on the bottom
  });

  cardTest('Mongoose Lizard', () => {
    let { s, ids } = board({ p1: lands(2), hand1: ['Mongoose Lizard'] });
    // Lawrence's library is all Plains: no Mountain to find.
    s = passBoth(act(s, { kind: 'activate', object: ids.hand1[0]!, ability: 0 }));
    expect(s.decision).toMatchObject({ kind: 'pick', player: 'p1', options: [], min: 0, max: 1 });
    s = settle(act(s, { kind: 'pick', cards: [] }));
    expect(s.zones['p1.graveyard'].map((id) => s.objects[id]!.card)).toEqual([idOf('Mongoose Lizard')]);
    const cast = board({ p1: lands(6), hand1: ['Mongoose Lizard'] });
    let c = passBoth(act(cast.s, { kind: 'cast', object: cast.ids.hand1[0]! }));
    c = settle(act(c, { kind: 'targets', targets: [['p2']] }));
    expect(lifeOf(c, 'p2')).toBe(19);
  });

  cardTest('Saber-Tooth Moose-Lion', () => {
    // Claire's library is all Forests.
    let { s, ids } = board({ p2: lands(2, 'Forest'), hand2: ['Saber-Tooth Moose-Lion'] });
    s = passUntil(s, (x) => x.turn === 2 && x.decision?.kind === 'priority' && x.decision.player === 'p2');
    s = passBoth(act(s, { kind: 'activate', object: ids.hand2[0]!, ability: 0 }));
    const options = (s.decision as { options: string[] }).options;
    expect(options.length).toBeGreaterThan(10);
    const hand = s.zones['p2.hand'].length;
    s = act(s, { kind: 'pick', cards: [options[0]!] });
    expect(s.zones['p2.hand']).toHaveLength(hand + 1);
  });

  cardTest('Rabaroo Troop', () => {
    const { s, ids } = board({ p1: ['Rabaroo Troop'], hand1: ['Plains'] });
    const after = settle(act(s, { kind: 'play', object: ids.hand1[0]! }));
    expect(chars(after, ids.p1[0]!).keywords).toContain('flying');
    expect(lifeOf(after, 'p1')).toBe(21);
    expect(legalActions(board({ p1: lands(2), hand1: ['Rabaroo Troop'] }).s).some((c) => c.kind === 'activate')).toBe(true);
  });

  cardTest('Giant Koi', () => {
    let { s, ids } = board({ p1: ['Giant Koi', ...lands(3, 'Island')], p2: ['Komodo Rhino'] });
    s = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0 }));
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = passUntil(s, (x) => x.step === 'main2'); // no block possible, so nobody is asked
    expect(lifeOf(s, 'p2')).toBe(15);
  });

  cardTest("Deserter's Disciple", () => {
    let { s, ids } = board({ p1: ["Deserter's Disciple", 'Capital Guard'], p2: ['Komodo Rhino'] });
    s = passBoth(act(s, { kind: 'activate', object: ids.p1[0]!, ability: 0, targets: [[ids.p1[1]!]] }));
    s = passUntil(act(toAttack(s), { kind: 'attack', attackers: [ids.p1[1]!] }), (x) => x.step === 'main2');
    expect(lifeOf(s, 'p2')).toBe(18);
  });

  cardTest("Roku's Mastery", () => {
    const { s, ids } = board({ p1: lands(6), p2: ['Komodo Rhino'], hand1: ["Roku's Mastery"] });
    expect(refused(s, { kind: 'cast', object: ids.hand1[0]!, x: 5, targets: [[ids.p2[0]!]] })).toMatch(/mana/);
    let after = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]!, x: 4, targets: [[ids.p2[0]!]] }));
    expect(after.decision).toMatchObject({ kind: 'arrange' }); // X ≥ 4: scry 2
    after = act(after, { kind: 'arrange', top: (after.decision as { cards: string[] }).cards, away: [] });
    expect(after.decision?.kind).toBe('priority');
    expect(named(after, 'Komodo Rhino')).toHaveLength(0);
  });

  cardTest('Explore', () => {
    let { s, ids } = board({ p1: lands(2, 'Forest'), hand1: ['Explore', 'Forest', 'Forest'] });
    s = passBoth(act(s, { kind: 'cast', object: ids.hand1[0]! }));
    s = act(act(s, { kind: 'play', object: ids.hand1[1]! }), { kind: 'play', object: ids.hand1[2]! });
    expect(named(s, 'Forest')).toHaveLength(4);
  });

  cardTest('Merchant of Many Hats', () => {
    let { s, ids } = board({ p1: lands(3, 'Swamp'), hand1: ['Merchant of Many Hats'] });
    s = structuredClone(s);
    const m = ids.hand1[0]!;
    s.zones['p1.hand'].splice(s.zones['p1.hand'].indexOf(m), 1); s.zones['p1.graveyard'].push(m); s.objects[m]!.zone = 'p1.graveyard';
    s = passBoth(act(s, { kind: 'activate', object: m, ability: 0 }));
    expect(s.zones['p1.hand'].map((id) => s.objects[id]!.card)).toContain(idOf('Merchant of Many Hats'));
  });

  cardTest('Master Pakku', () => {
    let { s, ids } = board({ p1: ['Master Pakku'], hand1: ['Water Whip', 'Earthbending Lesson'] });
    s = structuredClone(s);
    for (const id of ids.hand1) { // two Lessons in the graveyard
      s.zones['p1.hand'].splice(s.zones['p1.hand'].indexOf(id), 1); s.zones['p1.graveyard'].push(id); s.objects[id]!.zone = 'p1.graveyard';
    }
    const lib = s.zones['p2.library'].length;
    s = act(toAttack(s), { kind: 'attack', attackers: [ids.p1[0]!] });
    s = settle(act(s, { kind: 'targets', targets: [['p2']] }));
    expect(s.zones['p2.library']).toHaveLength(lib - 2);
  });
});
