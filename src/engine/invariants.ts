/**
 * Facts that hold after every engine step (technical design, "Testing"). Tests check them after
 * each answer; a violation is always an engine bug.
 */
import type { GameState } from './types';
import { PLAYERS } from './types';

export function checkInvariants(s: GameState): string[] {
  const errs: string[] = [];
  const seen = new Map<string, string>();
  for (const [zone, ids] of Object.entries(s.zones)) {
    for (const id of ids) {
      if (seen.has(id)) errs.push(`${id} is in ${seen.get(id)} and ${zone}`);
      seen.set(id, zone);
      const o = s.objects[id];
      if (!o) errs.push(`${zone} holds ${id}, which doesn't exist`);
      else if (o.zone !== zone) errs.push(`${id} says it is in ${o.zone} but is in ${zone}`);
    }
  }
  for (const id of Object.keys(s.objects)) if (!seen.has(id)) errs.push(`${id} is in no zone`);
  for (const o of Object.values(s.objects)) {
    if (o.zone !== 'battlefield' && (o.tapped || o.damage || o.attacking || o.blocking)) errs.push(`${o.id} keeps battlefield state in ${o.zone}`);
    if (o.zone !== 'battlefield' && o.zone !== 'stack' && o.controller !== o.owner) errs.push(`${o.id} has a controller outside the battlefield and stack`);
    if (o.zone.includes('.') && !o.zone.startsWith(o.owner)) errs.push(`${o.id} is in another player's ${o.zone}`);
    const combat = ['attackers', 'blockers', 'firstStrikeDamage', 'damage', 'endCombat'];
    if ((o.attacking || o.blocking) && !combat.includes(s.step)) errs.push(`${o.id} is in combat during ${s.step}`);
  }
  for (const p of PLAYERS) {
    if (!Number.isInteger(s.players[p].life)) errs.push(`${p}'s life is ${s.players[p].life}`);
    for (const [c, n] of Object.entries(s.players[p].pool)) if (n < 0) errs.push(`${p} has ${n} ${c} mana`);
  }
  if (s.result && s.decision) errs.push('a decision after the game ended');
  if (!s.result && !s.decision) errs.push('no decision and no result');
  return errs;
}
