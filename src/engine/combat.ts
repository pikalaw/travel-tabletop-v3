/**
 * Combat (CR 506–511): checking declarations, and combat damage. The attacking player divides an
 * attacker's damage among its blockers freely (the 2024 rules removed damage assignment order);
 * that is a decision only when the split can change the result.
 */
import { characteristics, hasKeyword, isType, summoningSick } from './characteristics';
import { dealDamage } from './effects';
import { battlefield, event, obj } from './state';
import { fire } from './triggers';
import { tap } from './zones';
import type { GameObject, GameState, ObjectId, PlayerId } from './types';
import { other } from './types';

const name = (s: GameState, o: GameObject) => characteristics(s, o).name;

export function canAttack(s: GameState, o: GameObject): boolean {
  return o.zone === 'battlefield' && o.controller === s.active && isType(s, o, 'Creature') && !o.tapped
    && !summoningSick(s, o) && (!hasKeyword(s, o, 'defender') || hasKeyword(s, o, "can attack as though it didn't have defender")) && !hasKeyword(s, o, "can't attack or block");
}

export function canBlock(s: GameState, blocker: GameObject, attacker: GameObject): boolean {
  if (blocker.zone !== 'battlefield' || blocker.controller === s.active || !isType(s, blocker, 'Creature') || blocker.tapped) return false;
  if (attacker.attacking === undefined || hasKeyword(s, blocker, "can't attack or block") || hasKeyword(s, blocker, "can't block")) return false;
  if (hasKeyword(s, attacker, 'flying') && !hasKeyword(s, blocker, 'flying') && !hasKeyword(s, blocker, 'reach')) return false;
  if (hasKeyword(s, attacker, "can't be blocked")) return false;
  if (hasKeyword(s, attacker, "can't be blocked by creatures with power 2 or less") && characteristics(s, blocker).power <= 2) return false;
  // The Spirit tokens: "can't block or be blocked by non-Spirit creatures".
  const SPIRIT_ONLY = "can't block or be blocked by non-spirit creatures";
  const spirit = (o: GameObject) => characteristics(s, o).subtypes.includes('Spirit');
  if ((hasKeyword(s, attacker, SPIRIT_ONLY) && !spirit(blocker)) || (hasKeyword(s, blocker, SPIRIT_ONLY) && !spirit(attacker))) return false;
  return true;
}

/** Why an attack declaration is illegal, or null. */
export function checkAttack(s: GameState, attackers: ObjectId[]): string | null {
  if (new Set(attackers).size !== attackers.length) return 'A creature is declared twice';
  for (const id of attackers) {
    const o = s.objects[id];
    if (!o || !canAttack(s, o)) return `${o ? name(s, o) : id} can't attack`;
    // Pipsqueak: "can't attack alone unless he has a +1/+1 counter on him".
    if (attackers.length === 1 && hasKeyword(s, o, "can't attack alone unless it has a +1/+1 counter") && !(o.counters['+1/+1']! > 0)) return `${name(s, o)} can't attack alone`;
  }
  return null;
}

export function declareAttackers(s: GameState, attackers: ObjectId[]): void {
  for (const id of attackers) {
    const o = obj(s, id);
    o.attacking = other(s.active);
    if (!hasKeyword(s, o, 'vigilance')) tap(s, id);
  }
  const who = s.setup.players[s.active].name;
  event(s, attackers.length ? `${who} attacks with ${attackers.map((id) => name(s, obj(s, id))).join(', ')}` : `${who} doesn't attack`);
  if (attackers.length) s.turnLog.attacked[s.active] = true;
  s.turnLog.attackers.push(...attackers);
  for (const id of attackers) fire(s, { kind: 'attacks', object: id }); // 508.3a
}

/** Why a block declaration is illegal, or null. Each blocker blocks one attacker. */
export function checkBlocks(s: GameState, blocks: { blocker: ObjectId; attacker: ObjectId }[]): string | null {
  if (new Set(blocks.map((b) => b.blocker)).size !== blocks.length) return 'A creature blocks twice';
  for (const b of blocks) {
    const blocker = s.objects[b.blocker], attacker = s.objects[b.attacker];
    if (!blocker || !attacker || !canBlock(s, blocker, attacker)) {
      return `${blocker ? name(s, blocker) : b.blocker} can't block ${attacker ? name(s, attacker) : b.attacker}`;
    }
  }
  // Menace (702.111b): blocked only by two or more creatures. Checked on the whole declaration.
  for (const a of attackers(s)) {
    const n = blocks.filter((b) => b.attacker === a.id).length;
    if (n === 1 && hasKeyword(s, a, 'menace')) return `${name(s, a)} has menace: it can't be blocked by just one creature`;
    if (n > 1 && hasKeyword(s, a, "can't be blocked by more than one creature")) return `${name(s, a)} can't be blocked by more than one creature`;
  }
  return null;
}

export function declareBlockers(s: GameState, blocks: { blocker: ObjectId; attacker: ObjectId }[]): void {
  for (const b of blocks) {
    const blocker = obj(s, b.blocker), attacker = obj(s, b.attacker);
    blocker.blocking = [attacker.id];
    attacker.blockedBy = [...(attacker.blockedBy ?? []), blocker.id];
    attacker.blocked = true;
  }
  const who = s.setup.players[other(s.active)].name;
  event(s, blocks.length
    ? `${who} blocks: ${blocks.map((b) => `${name(s, obj(s, b.blocker))} blocks ${name(s, obj(s, b.attacker))}`).join('; ')}`
    : `${who} doesn't block`);
}

export const attackers = (s: GameState) => battlefield(s).filter((o) => o.attacking !== undefined);
const inCombat = (s: GameState) => battlefield(s).filter((o) => o.attacking !== undefined || o.blocking !== undefined);

const firstStriker = (s: GameState, o: GameObject) => hasKeyword(s, o, 'first strike') || hasKeyword(s, o, 'double strike');

/** CR 510.4: there is a first-strike damage step only if a creature in combat has first or double strike. */
export const hasFirstStrikeStep = (s: GameState) => inCombat(s).some((o) => firstStriker(s, o));

/** Whether `o` deals combat damage in this damage step. */
function dealsDamageNow(s: GameState, o: GameObject): boolean {
  if (s.step === 'firstStrikeDamage') return firstStriker(s, o);
  return !o.dealtFirstStrike || hasKeyword(s, o, 'double strike');
}

/** Lethal damage for a blocker (CR 702.2c, 510.1c-d): toughness less damage, or 1 from deathtouch. */
function lethal(s: GameState, source: GameObject, target: GameObject): number {
  if (hasKeyword(s, source, 'deathtouch')) return target.damage > 0 && target.deathtouched ? 0 : 1;
  return Math.max(0, characteristics(s, target).toughness - target.damage);
}

/** Live blockers of an attacker, in the order they were declared. */
const blockersOf = (s: GameState, a: GameObject) => (a.blockedBy ?? []).map((id) => s.objects[id]).filter((b): b is GameObject => !!b && b.zone === 'battlefield');

/** The split the engine proposes, lethal to the blockers needing least first, the rest to the last (or the player, with trample). */
export function proposedSplit(s: GameState, a: GameObject): Record<ObjectId | 'player', number> {
  const power = Math.max(0, characteristics(s, a).power);
  const trample = hasKeyword(s, a, 'trample');
  const blockers = blockersOf(s, a).sort((x, y) => lethal(s, a, x) - lethal(s, a, y));
  const out: Record<string, number> = {};
  let left = power;
  for (const b of blockers) { const n = Math.min(left, lethal(s, a, b)); out[b.id] = n; left -= n; }
  if (left > 0) {
    if (trample) out.player = (out.player ?? 0) + left;
    else if (blockers.length) { const last = blockers[blockers.length - 1]!; out[last.id] = (out[last.id] ?? 0) + left; }
  }
  return out;
}

/**
 * Whether the attacker's split can change the result, so the attacking player is asked: two or
 * more blockers, and either trample or too little power to give every blocker lethal damage. With
 * one blocker, lethal to it and the rest through (with trample) is always at least as good.
 */
export function splitMatters(s: GameState, a: GameObject): boolean {
  const blockers = blockersOf(s, a);
  if (blockers.length < 2) return false;
  const power = Math.max(0, characteristics(s, a).power);
  return hasKeyword(s, a, 'trample') || power < blockers.reduce((n, b) => n + lethal(s, a, b), 0);
}

/** Why a split is illegal, or null (CR 510.1c-d). */
export function checkSplit(s: GameState, a: GameObject, assign: Record<string, number>): string | null {
  const power = Math.max(0, characteristics(s, a).power);
  const blockers = blockersOf(s, a);
  const keys = Object.keys(assign);
  if (keys.some((k) => k !== 'player' && !blockers.some((b) => b.id === k))) return 'Damage assigned to a creature not blocking it';
  if (Object.values(assign).some((n) => !Number.isInteger(n) || n < 0)) return 'Damage must be whole and not negative';
  if (Object.values(assign).reduce((x, y) => x + y, 0) !== power) return `Assign exactly ${power} damage`;
  if ((assign.player ?? 0) > 0) {
    if (!hasKeyword(s, a, 'trample')) return 'Only a trampler can assign damage to the player';
    if (blockers.some((b) => (assign[b.id] ?? 0) < lethal(s, a, b))) return 'Each blocker needs lethal damage before any goes to the player';
  }
  return null;
}

/** Attackers in this damage step whose split must be asked, in board order. */
export function splitsToAsk(s: GameState): GameObject[] {
  return attackers(s).filter((a) => dealsDamageNow(s, a) && !(a.id in s.assignments) && splitMatters(s, a));
}

/** Deals all combat damage of this step at once (CR 510.2). */
export function dealCombatDamage(s: GameState): void {
  const hits: { source: GameObject; target: ObjectId | PlayerId; amount: number }[] = [];
  for (const a of attackers(s)) {
    if (!dealsDamageNow(s, a)) continue;
    const power = Math.max(0, characteristics(s, a).power);
    if (power === 0) continue;
    if (!a.blocked) { hits.push({ source: a, target: a.attacking!, amount: power }); continue; }
    const split = s.assignments[a.id] ?? proposedSplit(s, a);
    for (const [k, n] of Object.entries(split)) if (n > 0) hits.push({ source: a, target: k === 'player' ? a.attacking! : k, amount: n });
  }
  for (const b of battlefield(s).filter((o) => o.blocking !== undefined)) {
    if (!dealsDamageNow(s, b)) continue;
    const target = s.objects[b.blocking![0]!];
    const power = Math.max(0, characteristics(s, b).power);
    if (target && target.zone === 'battlefield' && power > 0) hits.push({ source: b, target: target.id, amount: power });
  }
  const toPlayers = new Set<ObjectId>();
  for (const h of hits) {
    dealDamage(s, h.source.id, h.target, h.amount);
    if (h.target === 'p1' || h.target === 'p2') toPlayers.add(h.source.id);
  }
  for (const id of toPlayers) fire(s, { kind: 'dealsCombatDamageToPlayer', object: id });
  if (s.step === 'firstStrikeDamage') for (const o of inCombat(s)) if (firstStriker(s, o)) o.dealtFirstStrike = true;
  s.assignments = {};
}

/** CR 511.3: creatures stop being attacking and blocking as the end of combat step ends. */
export function endCombat(s: GameState): void {
  for (const o of battlefield(s)) {
    delete o.attacking; delete o.blocking; delete o.blockedBy; delete o.blocked; delete o.dealtFirstStrike;
  }
}
