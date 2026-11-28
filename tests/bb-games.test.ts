/**
 * Whole games with the real Beginner Box decks: random play, every player decision answered at
 * random among legal answers, never breaks an invariant and always replays exactly.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { pool } from '../src/cards/pool';
import { gameSetup } from '../src/cards/setup';
import { attackers as attacking, proposedSplit } from '../src/engine/combat';
import { characteristics } from '../src/engine/characteristics';
import { answer, attackCandidates, blockCandidates, legalActions, sacrificeCandidates, targetOptions, triggerTargetOptions } from '../src/engine/engine';
import { packetPlayable } from '../src/cards/coverage';
import { checkInvariants } from '../src/engine/invariants';
import { legalTargets } from '../src/engine/targets';
import { randomInt } from '../src/engine/state';
import type { Choice, GameState } from '../src/engine/types';
import { current, newGame, replay, submit, type Game } from '../src/host/controller';

const BB = pool.packets.filter((p) => p.name.startsWith('Avatar BB:'));
/** Every packet whose cards are all supported: the Beginner Box decks and the Jumpstart packets scripted so far. */
const PLAYABLE = pool.packets.filter(packetPlayable);

/** A random answer, from the game's own seeded source; `playOut` replaces one refused as a whole. */
function randomAnswer(s: GameState): Choice {
  const r = structuredClone(s);
  const n = (k: number) => randomInt(r, k);
  const pick = <T,>(xs: readonly T[]): T => xs[n(xs.length)]!;
  const some = <T,>(xs: readonly T[], max = xs.length): T[] => xs.filter(() => n(2) === 0).slice(0, max);
  const d = s.decision!;
  switch (d.kind) {
    case 'mulligan': return s.players[d.player].mulligans < 1 ? pick(legalActions(s)) : { kind: 'keep' };
    case 'bottom': case 'discard': return { kind: d.kind, cards: s.zones[`${d.player}.hand`].slice(0, d.count) };
    case 'legend': case 'may': case 'payOrElse': return pick(legalActions(s));
    case 'priority': {
      const c = pick(legalActions(s));
      if (c.kind !== 'cast' && c.kind !== 'activate') return c;
      const o = s.objects[c.object]!;
      const spell = s.setup.cards[o.card]?.script?.spell;
      if (c.kind === 'cast' && spell?.modes) {
        const m = n(spell.modes.options.length);
        const mode = spell.modes.options[m]!;
        const legal = (mode.targets ?? []).map((spec) => legalTargets(s, spec, { controller: d.player, source: c.object }));
        return { ...c, modes: [m], targets: legal.map((ts) => (ts.length ? [pick(ts)] : [])) };
      }
      // An additional-cost choice ("pay {4} or sacrifice …"): one at random, with a random sacrifice.
      const costs = c.kind === 'cast' ? spell?.costOptions : undefined;
      const cost = costs ? n(costs.length) : undefined;
      const sac = cost !== undefined ? costs![cost]!.cost.sacrifice : undefined;
      const paying = { ...(cost !== undefined ? { cost } : {}), ...(sac ? { sacrificing: [pick([...sacrificeCandidates(s, d.player, sac, c.object), c.object])] } : {}) };
      const opts = targetOptions(s, d.player, c.object, c.kind === 'activate' ? c.ability : undefined);
      const x = s.setup.cards[o.card]!.manaCost.some((m) => m.kind === 'x') ? n(4) : undefined;
      return { ...c, ...paying, ...(opts.length ? { targets: opts.map((t) => (t.legal.length ? [pick(t.legal)] : [])) } : {}), ...(x !== undefined ? { x } : {}) };
    }
    case 'attackers': return { kind: 'attack', attackers: some(attackCandidates(s)) };
    case 'blockers': {
      const menace = new Set(attacking(s).filter((a) => characteristics(s, a).keywords.includes('menace')).map((a) => a.id));
      return { kind: 'block', blocks: blockCandidates(s).flatMap(({ blocker, attackers }) => {
        const a = pick(attackers);
        return n(2) === 0 && !menace.has(a) ? [{ blocker, attacker: a }] : [];
      }) };
    }
    case 'damage': return { kind: 'damage', assign: proposedSplit(s, s.objects[d.attacker]!) };
    case 'triggerOrder': return { kind: 'order', triggers: d.triggers };
    case 'triggerTargets': return { kind: 'targets', targets: triggerTargetOptions(s).map((o) => (o.legal.length ? [pick(o.legal)] : [])) };
    case 'chooseColor': return { kind: 'color', color: pick(d.options) };
    case 'arrange': { const away = some(d.cards); return { kind: 'arrange', top: d.cards.filter((c) => !away.includes(c)), away }; }
    case 'choose': return { kind: 'option', index: n(d.options.length) };
    case 'pick': {
      if (d.orNone && n(2)) return { kind: 'pick', cards: [] };
      const cards = some(d.options, d.max);
      return { kind: 'pick', cards: cards.length >= d.min ? cards : d.options.slice(0, d.min) };
    }
  }
}

function playOut(g: Game, limit: number): Game {
  for (let i = 0; i < limit && !current(g).result; i++) {
    const s = current(g);
    let c = randomAnswer(s);
    const tried = answer(s, c);
    if ('refused' in tried) {
      // Random casts and blocks can be illegal as a whole (a mode without targets, menace): do nothing instead.
      const fallback: Partial<Record<string, Choice>> = { priority: { kind: 'pass' }, payOrElse: { kind: 'no' }, blockers: { kind: 'block', blocks: [] }, attackers: { kind: 'attack', attackers: [] } };
      const f = fallback[s.decision!.kind];
      if (!f) throw new Error(`refused ${JSON.stringify(c)} for ${JSON.stringify(s.decision)}: ${tried.refused}`);
      c = f;
    }
    const next = submit(g, c);
    if ('refused' in next) throw new Error(next.refused);
    g = next;
    const errs = checkInvariants(current(g));
    if (errs.length) throw new Error(`after choice ${i} (${JSON.stringify(c)}): ${errs.join('; ')}\n${current(g).events.slice(-8).map((e) => e.text).join('\n')}`);
  }
  return g;
}

describe('random games with Beginner Box decks', () => {
  it('never break an invariant, and replay exactly', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), (seed) => {
      const order = [...BB].sort((a, b) => ((a.id.charCodeAt(0) * seed) % 97) - ((b.id.charCodeAt(0) * seed) % 97));
      const setup = gameSetup({ p1: { name: 'Lawrence', packets: order.slice(0, 3).map((p) => p.id) }, p2: { name: 'Claire', packets: order.slice(3, 6).map((p) => p.id) } }, seed % 2 ? 'p1' : 'p2');
      const g = playOut(newGame(setup, seed), 1500);
      expect(replay(g.record)).toEqual(current(g));
    }), { numRuns: Number(process.env.BB_RUNS ?? 12) });
  }, 300_000);
});

describe('random games with any playable packets', () => {
  it('never break an invariant, and replay exactly', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), (seed) => {
      const order = [...PLAYABLE].sort((a, b) => ((a.id.length * 31 + a.id.charCodeAt(a.id.length - 1) * seed) % 101) - ((b.id.length * 31 + b.id.charCodeAt(b.id.length - 1) * seed) % 101));
      const setup = gameSetup({ p1: { name: 'Lawrence', packets: order.slice(0, 3).map((p) => p.id) }, p2: { name: 'Claire', packets: order.slice(3, 6).map((p) => p.id) } }, seed % 2 ? 'p1' : 'p2');
      const g = playOut(newGame(setup, seed), 1500);
      expect(replay(g.record)).toEqual(current(g));
    }), { numRuns: Number(process.env.JS_RUNS ?? 12) });
  }, 300_000);
});
