/**
 * Whole games: the M1 gate (a vanilla game plays to a win, and its log replays exactly), the
 * controller's stops, undo and redo, and random legal play that never breaks an invariant.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { attackers as attacking, proposedSplit } from '../src/engine/combat';
import { attackCandidates, blockCandidates, legalActions, targetOptions, triggerTargetOptions } from '../src/engine/engine';
import { ABILITY_CARDS } from './ability-cards';
import { checkInvariants } from '../src/engine/invariants';
import { randomInt } from '../src/engine/state';
import type { Choice, GameState } from '../src/engine/types';
import { canUndo, current, newGame, redo, replay, stopsHere, submit, undo, type Game } from '../src/host/controller';
import { characteristics } from '../src/engine/characteristics';
import { deck, setup } from './engine-support';
import { withShock } from './game-support';

function ok(g: Game | { refused: string }): Game {
  if ('refused' in g) throw new Error(g.refused);
  return g;
}

/** A plain player: keeps, plays a land, casts the biggest creature it can, attacks with everything, trades when it can. */
function simplePlayer(s: GameState): Choice {
  const d = s.decision!;
  switch (d.kind) {
    case 'mulligan': return { kind: 'keep' };
    case 'priority': {
      const acts = legalActions(s);
      const land = acts.find((c) => c.kind === 'play');
      if (land) return land;
      const casts = acts.filter((c): c is Choice & { kind: 'cast' } => c.kind === 'cast');
      casts.sort((a, b) => characteristics(s, s.objects[b.object]!).power - characteristics(s, s.objects[a.object]!).power);
      return casts[0] ?? { kind: 'pass' };
    }
    case 'attackers': return { kind: 'attack', attackers: attackCandidates(s) };
    case 'blockers': {
      const used = new Set<string>();
      const menace = new Set(attacking(s).filter((a) => characteristics(s, a).keywords.includes('menace')).map((a) => a.id));
      const blocks = blockCandidates(s).flatMap(({ blocker, attackers }) => {
        const b = characteristics(s, s.objects[blocker]!);
        const a = attackers.find((id) => !used.has(id) && !menace.has(id) && b.toughness > characteristics(s, s.objects[id]!).power - 1);
        if (!a) return [];
        used.add(a);
        return [{ blocker, attacker: a }];
      });
      return { kind: 'block', blocks };
    }
    case 'damage': return { kind: 'damage', assign: proposedSplit(s, s.objects[d.attacker]!) };
    case 'discard': return { kind: 'discard', cards: s.zones[`${d.player}.hand`].slice(0, d.count) };
    case 'bottom': return { kind: 'bottom', cards: s.zones[`${d.player}.hand`].slice(0, d.count) };
    case 'legend': return { kind: 'legend', keep: d.objects[0]! };
    default: return otherDecision(s);
  }
}

/** The decisions abilities bring: take the first legal answer. */
function otherDecision(s: GameState): Choice {
  const d = s.decision!;
  switch (d.kind) {
    case 'triggerOrder': return { kind: 'order', triggers: d.triggers };
    case 'triggerTargets': return { kind: 'targets', targets: triggerTargetOptions(s).map((o) => o.legal.slice(0, 'objects' in o.spec ? o.spec.count ?? 1 : 1)) };
    case 'may': return { kind: 'yes' };
    case 'discardEffect': return { kind: 'discard', cards: s.zones[`${d.player}.hand`].slice(0, d.count) };
    default: throw new Error(`no answer for ${d.kind}`);
  }
}

function playOut(g: Game, player: (s: GameState) => Choice, limit = 3000): Game {
  for (let i = 0; i < limit && !current(g).result; i++) {
    g = ok(submit(g, player(current(g))));
    const errs = checkInvariants(current(g));
    if (errs.length) throw new Error(`after choice ${i}: ${errs.join('; ')}`);
  }
  return g;
}

describe('the M1 gate', () => {
  it('a vanilla game plays to a win, and its log replays to the same state', () => {
    const g = playOut(newGame(setup(deck('mountain', ['ogre', 'giant', 'goblin']), deck('forest', ['bear', 'spider', 'rhino'])), 2026), simplePlayer);
    const end = current(g);
    expect(end.result?.winner).toMatch(/^p[12]$/);
    expect(end.result?.reason).toMatch(/life|empty library/);
    expect(replay(g.record)).toEqual(end);
    expect(g.record.choices.filter((c) => !c.auto).length).toBeLessThan(g.record.choices.length); // the controller passed for players
  });
});

describe('the controller', () => {
  it('stops only at the fixed windows, for a player who can do something there', () => {
    let g = withShock(ok(submit(ok(submit(newGame(setup(), 3), { kind: 'keep' })), { kind: 'keep' })))[0];
    // The upkeep and draw steps pass by themselves: the first stop is p1's main phase.
    expect(current(g).step).toBe('main1');
    expect(current(g).decision).toEqual({ kind: 'priority', player: 'p1' });
    g = ok(submit(g, { kind: 'pass' }));
    // p2 has no stop in p1's main phase; with nothing to attack with, combat passes by itself.
    expect(current(g).step).toBe('main2');
    g = ok(submit(g, { kind: 'pass' }));
    // p2's first stop is p1's end step.
    expect(current(g).step).toBe('end');
    expect(current(g).decision).toEqual({ kind: 'priority', player: 'p2' });
    expect(stopsHere(current(g), 'p1')).toBe(false);
  });

  it('undo takes back the last decision with the automatic passes after it; redo replays it', () => {
    let g = ok(submit(ok(submit(newGame(setup(), 3), { kind: 'keep' })), { kind: 'keep' }));
    const before = current(g);
    const land = legalActions(before).find((c) => c.kind === 'play')!;
    g = ok(submit(g, land));
    g = ok(submit(g, { kind: 'pass' }));
    const after = current(g);
    g = undo(g);
    expect(current(g).zones.battlefield).toHaveLength(1);
    g = undo(g);
    expect(current(g)).toEqual(before);
    g = redo(redo(g));
    expect(current(g)).toEqual(after);
    expect(canUndo(newGame(setup(), 3))).toBe(false);
  });

  it('a new decision clears redo', () => {
    let g = ok(submit(ok(submit(newGame(setup(), 3), { kind: 'keep' })), { kind: 'keep' }));
    g = ok(submit(g, { kind: 'pass' }));
    g = undo(g);
    expect(g.redo).toHaveLength(1);
    g = ok(submit(g, { kind: 'pass' }));
    expect(g.redo).toHaveLength(0);
  });
});

describe('random legal play', () => {
  /** Picks any legal answer, using the game's own seeded source so a run is reproducible. */
  function randomPlayer(s: GameState): Choice {
    const r = structuredClone(s);
    const pick = <T,>(xs: T[]): T => xs[randomInt(r, xs.length)]!;
    const d = s.decision!;
    switch (d.kind) {
      case 'mulligan': return s.players[d.player].mulligans < 2 ? pick(legalActions(s)) : { kind: 'keep' };
      case 'legend': return pick(legalActions(s));
      case 'priority': {
        const c = pick(legalActions(s));
        if (c.kind !== 'cast' && c.kind !== 'activate') return c;
        const opts = targetOptions(s, d.player, c.object, c.kind === 'activate' ? c.ability : undefined);
        if (!opts.length) return c;
        return { ...c, targets: opts.map((o) => [pick(o.legal)]) };
      }
      case 'attackers': return { kind: 'attack', attackers: attackCandidates(s).filter(() => randomInt(r, 2) === 0) };
      case 'blockers': {
        const menace = new Set(attacking(s).filter((a) => characteristics(s, a).keywords.includes('menace')).map((a) => a.id));
        return { kind: 'block', blocks: blockCandidates(s).flatMap(({ blocker, attackers }) => {
          const a = pick(attackers);
          return randomInt(r, 2) === 0 && !menace.has(a) ? [{ blocker, attacker: a }] : [];
        }) };
      }
      case 'damage': return { kind: 'damage', assign: proposedSplit(s, s.objects[d.attacker]!) };
      case 'discard': case 'bottom': return { kind: d.kind, cards: s.zones[`${d.player}.hand`].slice(0, d.count) };
      default: return otherDecision(s);
    }
  }

  it('never breaks an invariant, and every game replays exactly', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), (seed) => {
      const g = playOut(newGame(setup(deck('mountain', ['ogre', 'goblin', 'knight', 'twin']), deck('forest', ['bear', 'wall', 'rhino', 'viper', 'spider'])), seed), randomPlayer, 600);
      expect(replay(g.record)).toEqual(current(g));
    }), { numRuns: 8 });
  }, 60_000);

  it('with spells, abilities, triggers and replacements in the decks too', () => {
    const d1 = deck('mountain', ['shock', 'monk', 'sparker', 'mourner', 'cadet', 'rally', 'pinger', 'burnout', 'hatchling', 'giant']);
    const d2 = deck('forest', ['growth', 'elf', 'drummer', 'herald', 'ground', 'bear', 'martyr', 'wither', 'scholar', 'stunner']);
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), (seed) => {
      const g = playOut(newGame({ ...setup(d1, d2), cards: ABILITY_CARDS }, seed), randomPlayer, 500);
      expect(replay(g.record)).toEqual(current(g));
    }), { numRuns: 8 });
  }, 120_000);
});
