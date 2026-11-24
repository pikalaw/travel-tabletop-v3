/**
 * The effect interpreter (608.2): runs a resolving spell's or ability's effects in order. An effect
 * that needs a player's choice (a discard, a "may") stops with a decision; the answer resumes it at
 * the same place. `s.resolving` holds where it is, as plain data.
 */
import type { Effect, ObjectRef, PlayerRef } from './abilities';
import { characteristics, view } from './characteristics';
import { amount, holds, objects, type Context } from './evaluate';
import { draw, event, move, obj, top, zoneOf } from './state';
import type { Choice, GameState, PlayerId, Target } from './types';
import { other, PLAYERS } from './types';
import { addCounters, createToken, leaveBattlefield, tap } from './zones';

const isPlayer = (t: Target): t is PlayerId => t === 'p1' || t === 'p2';
const name = (s: GameState, p: PlayerId) => s.setup.players[p].name;

function ctxOf(s: GameState): Context {
  const r = s.resolving!;
  return { controller: r.controller, source: r.source, targets: r.targets, ...(r.eventObject ? { eventObject: r.eventObject } : {}) };
}

function players(s: GameState, ref: PlayerRef, ctx: Context): PlayerId[] {
  if (ref === 'you') return [ctx.controller];
  if (ref === 'opponent') return [other(ctx.controller)];
  if (ref === 'each') return [...PLAYERS];
  return (ctx.targets?.[ref.target] ?? []).filter(isPlayer);
}

const isPlayerRef = (r: ObjectRef | PlayerRef): r is 'you' | 'opponent' | 'each' => r === 'you' || r === 'opponent' || r === 'each';

/** Objects and players a reference names; target references may hold either. */
function recipients(s: GameState, ref: ObjectRef | PlayerRef, ctx: Context): Target[] {
  if (isPlayerRef(ref)) return players(s, ref, ctx);
  if (typeof ref === 'object' && 'target' in ref) {
    return (ctx.targets?.[ref.target] ?? []).filter((t) => isPlayer(t) || s.objects[t]);
  }
  return objects(s, view(s), ref, ctx).map((o) => o.id);
}

const objs = (s: GameState, ref: ObjectRef, ctx: Context) => objects(s, view(s), ref, ctx);

/** Deals damage from a source (120.3): to a player, life loss; to a creature, marked damage. */
export function dealDamage(s: GameState, sourceId: string, to: Target, n: number): void {
  if (n <= 0) return;
  const src = s.objects[sourceId];
  const kws = src ? characteristics(s, src).keywords : [];
  const srcName = src ? characteristics(s, src).name : 'A source';
  if (isPlayer(to)) {
    s.players[to].life -= n;
    event(s, `${srcName} deals ${n} damage to ${name(s, to)}`);
  } else {
    const o = s.objects[to];
    if (!o || o.zone !== 'battlefield') return;
    o.damage += n;
    if (kws.includes('deathtouch')) o.deathtouched = true;
    event(s, `${srcName} deals ${n} damage to ${characteristics(s, o).name}`);
  }
  if (src && kws.includes('lifelink')) s.players[src.controller].life += n;
}

/** Runs effects from s.resolving.pc. Returns 'wait' when a decision is needed, 'done' at the end. */
export function runEffects(s: GameState, choice?: Choice): 'done' | 'wait' {
  const r = s.resolving!;
  while (r.pc < r.effects.length) {
    const result = step(s, r.effects[r.pc]!, choice);
    choice = undefined;
    if (result === 'wait') return 'wait';
    r.pc++;
  }
  return 'done';
}

/** Inserts effects to run next (a "may" accepted, an "if" that holds). */
function splice(s: GameState, effects: Effect[]): void {
  const r = s.resolving!;
  r.effects = [...r.effects.slice(0, r.pc + 1), ...effects, ...r.effects.slice(r.pc + 1)];
}

function step(s: GameState, e: Effect, choice: Choice | undefined): 'next' | 'wait' {
  const ctx = ctxOf(s);
  const v = view(s);
  const n = (a: Parameters<typeof amount>[2]) => amount(s, v, a, ctx);
  if ('draw' in e) {
    for (const p of players(s, e.draw, ctx)) { const k = n(e.n); draw(s, p, k); event(s, `${name(s, p)} draws ${k === 1 ? 'a card' : `${k} cards`}`); }
  } else if ('discard' in e) {
    const [p] = players(s, e.discard, ctx);
    if (!p) return 'next';
    const hand = s.zones[zoneOf(p, 'hand')];
    const k = Math.min(n(e.n), hand.length);
    let cards = hand.slice(0, k);
    if (k > 0 && k < hand.length) {
      if (!choice) { s.decision = { kind: 'discardEffect', player: p, count: k }; return 'wait'; }
      if (choice.kind !== 'discard') throw new Error('expected a discard');
      cards = choice.cards;
    }
    for (const id of cards) { event(s, `${name(s, p)} discards ${characteristics(s, obj(s, id)).name}`); move(s, id, zoneOf(p, 'graveyard')); }
  } else if ('damage' in e) {
    const from = e.from ? objs(s, e.from, ctx)[0]?.id ?? ctx.source : ctx.source;
    for (const t of recipients(s, e.to, ctx)) dealDamage(s, from, t, n(e.damage));
  } else if ('gainLife' in e) {
    for (const p of players(s, e.gainLife, ctx)) { const k = n(e.n); s.players[p].life += k; event(s, `${name(s, p)} gains ${k} life`); }
  } else if ('loseLife' in e) {
    for (const p of players(s, e.loseLife, ctx)) { const k = n(e.n); s.players[p].life -= k; event(s, `${name(s, p)} loses ${k} life`); }
  } else if ('addCounters' in e) {
    for (const o of objs(s, e.on, ctx)) addCounters(s, o.id, e.addCounters, n(e.n));
  } else if ('removeCounters' in e) {
    for (const o of objs(s, e.on, ctx)) o.counters[e.removeCounters] = Math.max(0, (o.counters[e.removeCounters] ?? 0) - n(e.n));
  } else if ('pump' in e) {
    const affected = objs(s, e.pump, ctx).map((o) => o.id);
    s.effects.push({ effect: { affects: 'self', modify: [n(e.power), n(e.toughness)] }, affected, timestamp: s.nextTimestamp++, duration: e.duration, controller: ctx.controller, source: ctx.source });
  } else if ('grant' in e) {
    const affected = objs(s, e.grant, ctx).map((o) => o.id);
    s.effects.push({ effect: { affects: 'self', addKeywords: e.keywords }, affected, timestamp: s.nextTimestamp++, duration: e.duration, controller: ctx.controller, source: ctx.source });
  } else if ('continuous' in e) {
    const affected = objs(s, e.on, ctx).map((o) => o.id);
    s.effects.push({ effect: { affects: 'self', ...e.continuous }, affected, timestamp: s.nextTimestamp++, duration: e.duration, controller: ctx.controller, source: ctx.source });
  } else if ('exileIfWouldDie' in e) {
    const affected = objs(s, e.exileIfWouldDie, ctx).map((o) => o.id);
    s.effects.push({ effect: { affects: 'self', exileIfWouldDie: true }, affected, timestamp: s.nextTimestamp++, duration: e.duration, controller: ctx.controller, source: ctx.source });
  } else if ('destroy' in e) {
    // 702.12b: indestructible permanents aren't destroyed.
    const ids = objs(s, e.destroy, ctx).filter((o) => !v(o).keywords.includes('indestructible')).map((o) => o.id);
    for (const id of ids) event(s, `${v(obj(s, id)).name} is destroyed`);
    leaveBattlefield(s, ids, 'graveyard');
  } else if ('exile' in e) {
    leaveBattlefield(s, objs(s, e.exile, ctx).map((o) => o.id), 'exile');
  } else if ('bounce' in e) {
    leaveBattlefield(s, objs(s, e.bounce, ctx).map((o) => o.id), 'hand');
  } else if ('sacrifice' in e) {
    leaveBattlefield(s, objs(s, e.sacrifice, ctx).filter((o) => o.controller === ctx.controller).map((o) => o.id), 'graveyard');
  } else if ('tap' in e) {
    for (const o of objs(s, e.tap, ctx)) tap(s, o.id);
  } else if ('untap' in e) {
    for (const o of objs(s, e.untap, ctx)) o.tapped = false;
  } else if ('createToken' in e) {
    const [p = ctx.controller] = e.controller ? players(s, e.controller, ctx) : [ctx.controller];
    const k = n(e.n);
    for (let i = 0; i < k; i++) createToken(s, e.createToken, p, { tapped: !!e.tapped });
    event(s, `${name(s, p)} creates ${k} ${s.setup.cards[e.createToken]!.name} token${k > 1 ? 's' : ''}`);
  } else if ('addMana' in e) {
    if (e.anyColor) throw new Error('mana of any colour is chosen by the payment solver; the vocabulary adds it with M4');
    const k = e.n === undefined ? 1 : n(e.n);
    for (const c of e.addMana) s.players[ctx.controller].pool[c] += k;
  } else if ('mill' in e) {
    for (const p of players(s, e.mill, ctx)) for (let i = n(e.n); i > 0; i--) { const id = top(s, p); if (id) move(s, id, zoneOf(p, 'graveyard')); }
  } else if ('counterSpell' in e) {
    for (const t of recipients(s, e.counterSpell, ctx)) {
      const o = !isPlayer(t) ? s.objects[t] : undefined;
      if (!o || o.zone !== 'stack') continue;
      event(s, `${characteristics(s, o).name} is countered`);
      if (o.ability) { s.zones.stack.splice(s.zones.stack.indexOf(o.id), 1); delete s.objects[o.id]; } else move(s, o.id, zoneOf(o.owner, 'graveyard'));
    }
  } else if ('may' in e) {
    if (!choice) { s.decision = { kind: 'may', player: ctx.controller, text: describe(e.may) }; return 'wait'; }
    if (choice.kind === 'yes') splice(s, e.may);
  } else if ('if' in e) {
    const branch = holds(s, v, e.if, ctx) ? e.then : e.else ?? [];
    splice(s, branch);
  } else {
    throw new Error(`unknown effect ${JSON.stringify(e)}`);
  }
  return 'next';
}

/** A short public description of effects, for a "may" prompt. */
function describe(effects: Effect[]): string {
  return effects.map((e) => Object.keys(e)[0]).join(', ');
}
