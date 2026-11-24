/**
 * State-based actions (CR 704), checked whenever a player would receive priority and repeated
 * until none apply. They happen at once, except the legend rule's choice, which is a decision.
 */
import { characteristics, isType } from './characteristics';
import { battlefield, event } from './state';
import { leaveBattlefield } from './zones';
import type { GameState, PlayerId } from './types';
import { PLAYERS } from './types';

/** Performs one round of state-based actions. True if anything happened, so the caller checks again. */
export function stateBasedActions(s: GameState): boolean {
  let acted = false;

  // 704.5a, 704.5b: a player at 0 or less life, or who drew from an empty library, loses.
  const losers = PLAYERS.filter((p) => s.players[p].life <= 0 || s.players[p].drewFromEmpty);
  if (losers.length > 0) {
    endGame(s, losers);
    return true;
  }

  // 704.5f, 704.5g, 704.5h: creatures with 0 toughness, lethal damage, or deathtouch damage.
  const dying = battlefield(s).filter((o) => {
    if (!isType(s, o, 'Creature')) return false;
    const t = characteristics(s, o).toughness;
    return t <= 0 || (o.damage > 0 && (o.damage >= t || o.deathtouched));
  });
  for (const o of dying) event(s, `${characteristics(s, o).name} dies`);
  if (dying.length) { leaveBattlefield(s, dying.map((o) => o.id), 'graveyard', { dies: true }); acted = true; }

  // 704.5j: the legend rule. Its choice is a decision for the controller.
  for (const p of PLAYERS) {
    const byName = new Map<string, string[]>();
    for (const o of battlefield(s)) {
      if (o.controller !== p || !characteristics(s, o).supertypes.includes('Legendary')) continue;
      const name = characteristics(s, o).name;
      byName.set(name, [...(byName.get(name) ?? []), o.id]);
    }
    for (const [name, ids] of byName) {
      if (ids.length > 1) { s.decision = { kind: 'legend', player: p, name, objects: ids }; return true; }
    }
  }

  // 704.5q: +1/+1 and −1/−1 counters on one permanent cancel in pairs.
  for (const o of battlefield(s)) {
    const plus = o.counters['+1/+1'] ?? 0, minus = o.counters['-1/-1'] ?? 0;
    const n = Math.min(plus, minus);
    if (n > 0) { o.counters['+1/+1'] = plus - n; o.counters['-1/-1'] = minus - n; acted = true; }
  }
  return acted;
}

function endGame(s: GameState, losers: PlayerId[]): void {
  const name = (p: PlayerId) => s.setup.players[p].name;
  if (losers.length === 2) {
    s.result = { winner: null, reason: 'Both players lost at once' };
  } else {
    const loser = losers[0]!;
    const why = s.players[loser].life <= 0 ? `${name(loser)} is at ${s.players[loser].life} life` : `${name(loser)} drew from an empty library`;
    s.result = { winner: loser === 'p1' ? 'p2' : 'p1', reason: why };
  }
  event(s, s.result.winner ? `${name(s.result.winner)} wins: ${s.result.reason}` : `The game is a draw: ${s.result.reason}`);
  s.decision = null;
  s.priority = null;
}
