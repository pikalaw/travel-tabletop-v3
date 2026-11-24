import { describe, expect, it } from 'vitest';
import { proposedSplit } from '../src/engine/combat';
import { attackCandidates, start } from '../src/engine/engine';
import type { CardId, GameState, ObjectId } from '../src/engine/types';
import { act, at, blockCandidates, decisionIs, keepBoth, lifeOf, onBattlefield, passUntil, place, refused, setup } from './engine-support';

/** Turn 1, p1's first main phase, with these creatures in play for each player. */
function board(mine: CardId[], theirs: CardId[]): [GameState, ObjectId[], ObjectId[]] {
  let s = passUntil(keepBoth(start(setup(), 7)), at('main1', 'p1'));
  let a: ObjectId[], b: ObjectId[];
  [s, a] = place(s, 'p1', mine);
  [s, b] = place(s, 'p2', theirs);
  return [s, a, b];
}

const toAttackers = (s: GameState) => passUntil(s, decisionIs('attackers'));
const attack = (s: GameState, ids: ObjectId[]) => act(toAttackers(s), { kind: 'attack', attackers: ids });
const block = (s: GameState, blocks: [ObjectId, ObjectId][]) =>
  act(passUntil(s, decisionIs('blockers')), { kind: 'block', blocks: blocks.map(([blocker, attacker]) => ({ blocker, attacker })) });
const toMain2 = (s: GameState) => passUntil(s, at('main2'));

describe('declaring attackers', () => {
  it('taps attackers; summoning-sick creatures and defenders can\'t attack', () => {
    let [s, [ogre, wall]] = board(['ogre', 'wall'], []);
    let fresh: ObjectId;
    [s, [fresh]] = place(s, 'p1', ['giant']) as [GameState, [ObjectId]];
    s = structuredClone(s);
    s.objects[fresh]!.controlledSince = s.turn;
    s = toAttackers(s);
    expect(attackCandidates(s)).toEqual([ogre]);
    expect(refused(s, { kind: 'attack', attackers: [wall!] })).toMatch(/can't attack/);
    expect(refused(s, { kind: 'attack', attackers: [fresh] })).toMatch(/can't attack/);
    s = act(s, { kind: 'attack', attackers: [ogre!] });
    expect(s.objects[ogre!]!.tapped).toBe(true);
  });

  it('with nothing declared, skips blockers and damage', () => {
    let [s] = board(['ogre'], ['bear']);
    s = attack(s, []);
    s = passUntil(s, (x) => x.step !== 'attackers');
    expect(s.step).toBe('endCombat');
  });
});

describe('combat damage', () => {
  it('an unblocked attacker damages the defending player', () => {
    let [s, [ogre]] = board(['ogre'], []);
    s = toMain2(attack(s, [ogre!]));
    expect(lifeOf(s, 'p2')).toBe(18);
  });

  it('blocked creatures trade, and both die', () => {
    let [s, [ogre], [bear]] = board(['ogre'], ['bear']);
    s = toMain2(block(attack(s, [ogre!]), [[bear!, ogre!]]));
    expect(lifeOf(s, 'p2')).toBe(20);
    expect(onBattlefield(s, 'Gray Ogre') + onBattlefield(s, 'Grizzly Bears')).toBe(0);
  });

  it('first strike kills a blocker before it deals damage', () => {
    let [s, [knight], [bear]] = board(['knight'], ['bear']);
    s = toMain2(block(attack(s, [knight!]), [[bear!, knight!]]));
    expect(onBattlefield(s, 'Striking Knight')).toBe(1);
    expect(onBattlefield(s, 'Grizzly Bears')).toBe(0);
  });

  it('double strike deals damage in both steps', () => {
    let [s, [twin]] = board(['twin'], []);
    s = toMain2(attack(s, [twin!]));
    expect(lifeOf(s, 'p2')).toBe(16);
  });

  it('deathtouch makes any damage lethal; lifelink gains life', () => {
    let [s, [viper, cleric], [giant]] = board(['viper', 'cleric'], ['giant']);
    s = toMain2(block(attack(s, [viper!, cleric!]), [[giant!, viper!]]));
    expect(onBattlefield(s, 'Hill Giant')).toBe(0);
    expect(lifeOf(s, 'p1')).toBe(22);
    expect(lifeOf(s, 'p2')).toBe(18);
  });

  it('trample assigns lethal to the blocker and the rest to the player', () => {
    let [s, [rhino], [bear]] = board(['rhino'], ['bear']);
    s = toMain2(block(attack(s, [rhino!]), [[bear!, rhino!]]));
    expect(lifeOf(s, 'p2')).toBe(18);
    expect(onBattlefield(s, 'Grizzly Bears')).toBe(0);
  });

  it('asks the attacker to divide damage among blockers only when it matters', () => {
    let [s, [giant], [bear, wall]] = board(['giant'], ['bear', 'wall']);
    s = block(attack(s, [giant!]), [[bear!, giant!], [wall!, giant!]]);
    s = passUntil(s, decisionIs('damage'));
    expect(s.decision).toMatchObject({ kind: 'damage', player: 'p1', attacker: giant, power: 3 });
    expect(proposedSplit(s, s.objects[giant!]!)).toEqual({ [bear!]: 2, [wall!]: 1 });
    expect(refused(s, { kind: 'damage', assign: { [bear!]: 1, [wall!]: 1 } })).toMatch(/exactly 3/);
    expect(refused(s, { kind: 'damage', assign: { [bear!]: 1, player: 2 } })).toMatch(/trampler/);
    s = toMain2(act(s, { kind: 'damage', assign: { [wall!]: 3 } }));
    expect(onBattlefield(s, 'Wall of Wood')).toBe(0);
    expect(onBattlefield(s, 'Grizzly Bears')).toBe(1);
  });

  it('doesn\'t ask when power covers every blocker', () => {
    let [s, [rhino], [bear, viper]] = board(['giant'], ['bear', 'viper']);
    // A 3/3 against 2/2 and 1/1: 2 + 1 is lethal to both, so there is nothing to choose.
    s = toMain2(block(attack(s, [rhino!]), [[bear!, rhino!], [viper!, rhino!]]));
    expect(onBattlefield(s, 'Grizzly Bears') + onBattlefield(s, 'Deathtouch Viper')).toBe(0);
  });
});

describe('blocking restrictions', () => {
  it('flying can be blocked only by flying or reach', () => {
    let [s, [bird], [bear, spider]] = board(['bird'], ['bear', 'spider']);
    s = passUntil(attack(s, [bird!]), decisionIs('blockers'));
    expect(blockCandidates(s)).toEqual([{ blocker: spider, attackers: [bird] }]);
    expect(refused(s, { kind: 'block', blocks: [{ blocker: bear!, attacker: bird! }] })).toMatch(/can't block/);
  });

  it('menace needs two or more blockers', () => {
    let [s, [goblin], [bear, spider]] = board(['goblin'], ['bear', 'spider']);
    s = passUntil(attack(s, [goblin!]), decisionIs('blockers'));
    expect(refused(s, { kind: 'block', blocks: [{ blocker: bear!, attacker: goblin! }] })).toMatch(/menace/);
    s = act(s, { kind: 'block', blocks: [{ blocker: bear!, attacker: goblin! }, { blocker: spider!, attacker: goblin! }] });
    expect(s.objects[goblin!]!.blockedBy).toEqual([bear, spider]);
  });

  it('a tapped creature can\'t block', () => {
    let [s, [ogre], [bear]] = board(['ogre'], ['bear']);
    s = structuredClone(s);
    s.objects[bear!]!.tapped = true;
    s = attack(s, [ogre!]);
    s = toMain2(s); // no legal blocker, so nobody is asked
    expect(lifeOf(s, 'p2')).toBe(18);
  });
});
