/**
 * The effect interpreter (608.2): runs a resolving spell's or ability's effects in order. An effect
 * that needs a player's choice (a discard, a "may") stops with a decision; the answer resumes it at
 * the same place. `s.resolving` holds where it is, as plain data.
 */
import type { Continuous, Duration, Effect, ObjectRef, PlayerRef } from './abilities';
import { characteristics, view } from './characteristics';
import { amount, countersOf, holds, matches, objects, select, type Context } from './evaluate';
import { shuffle } from './rng';
import { draw, event, move, obj, shuffleLibrary, top, zoneOf } from './state';
import type { Choice, GameState, ObjectId, PlayerId, Target } from './types';
import { other, PLAYERS } from './types';
import { addCounters, createToken, leaveBattlefield, putOntoBattlefield, tap } from './zones';

const isPlayer = (t: Target): t is PlayerId => t === 'p1' || t === 'p2';
const name = (s: GameState, p: PlayerId) => s.setup.players[p].name;

function ctxOf(s: GameState): Context {
  const r = s.resolving!;
  return { controller: r.controller, source: r.source, targets: r.targets, ...(r.eventObject ? { eventObject: r.eventObject } : {}), ...(r.x !== undefined ? { x: r.x } : {}), ...(r.created ? { created: r.created } : {}), ...(r.attachedTo ? { attachedTo: r.attachedTo } : {}) };
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
    s.turnLog.lifeLost[to] += n;
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

/** A continuous effect from a resolving spell or ability (611.2), its affected set fixed now. */
function addEffect(s: GameState, ctx: Context, effect: Continuous, affected: ObjectId[], duration: Duration): void {
  const src = s.objects[ctx.source];
  s.effects.push({ effect, affected, timestamp: s.nextTimestamp++, duration, controller: ctx.controller, source: ctx.source, ...(src ? { sourceName: characteristics(s, src).name } : {}) });
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
    for (const t of recipients(s, e.to, ctx)) {
      const k = n(e.damage);
      // 120.4a: excess damage is damage beyond what's lethal (one, from a deathtouch source).
      const o = !isPlayer(t) ? s.objects[t] : undefined;
      const lethal = o ? (s.objects[from] && characteristics(s, s.objects[from]!).keywords.includes('deathtouch') ? (v(o).toughness - o.damage > 0 ? 1 : 0) : Math.max(0, v(o).toughness - o.damage)) : 0;
      dealDamage(s, from, t, k);
      if (e.gainExcess && o && k > lethal) { s.players[ctx.controller].life += k - lethal; event(s, `${name(s, ctx.controller)} gains ${k - lethal} life`); }
    }
  } else if ('gainLife' in e) {
    for (const p of players(s, e.gainLife, ctx)) { const k = n(e.n); s.players[p].life += k; event(s, `${name(s, p)} gains ${k} life`); }
  } else if ('loseLife' in e) {
    for (const p of players(s, e.loseLife, ctx)) { const k = n(e.n); s.players[p].life -= k; s.turnLog.lifeLost[p] += k; event(s, `${name(s, p)} loses ${k} life`); }
  } else if ('addCounters' in e) {
    for (const o of objs(s, e.on, ctx)) addCounters(s, o.id, e.addCounters, n(e.n));
  } else if ('removeCounters' in e) {
    for (const o of objs(s, e.on, ctx)) o.counters[e.removeCounters] = Math.max(0, (o.counters[e.removeCounters] ?? 0) - n(e.n));
  } else if ('removeAnyCounters' in e) {
    for (const o of objs(s, e.on, ctx)) {
      let left = e.removeAnyCounters;
      for (const k of Object.keys(o.counters).sort((a, b) => Number(b === '+1/+1') - Number(a === '+1/+1'))) {
        const take = Math.min(left, o.counters[k] ?? 0);
        o.counters[k] = (o.counters[k] ?? 0) - take;
        left -= take;
      }
    }
  } else if ('pump' in e) {
    const affected = objs(s, e.pump, ctx).map((o) => o.id);
    addEffect(s, ctx, { affects: 'self', modify: [n(e.power), n(e.toughness)] }, affected, e.duration);
  } else if ('grant' in e) {
    const affected = objs(s, e.grant, ctx).map((o) => o.id);
    addEffect(s, ctx, { affects: 'self', addKeywords: e.keywords }, affected, e.duration);
  } else if ('continuous' in e) {
    const affected = objs(s, e.on, ctx).map((o) => o.id);
    addEffect(s, ctx, { affects: 'self', ...e.continuous }, affected, e.duration);
  } else if ('exileIfWouldDie' in e) {
    const affected = objs(s, e.exileIfWouldDie, ctx).map((o) => o.id);
    addEffect(s, ctx, { affects: 'self', exileIfWouldDie: true }, affected, e.duration);
  } else if ('destroy' in e) {
    // 702.12b: indestructible permanents aren't destroyed.
    const ids = objs(s, e.destroy, ctx).filter((o) => !v(o).keywords.includes('indestructible')).map((o) => o.id);
    for (const id of ids) event(s, `${v(obj(s, id)).name} is destroyed`);
    leaveBattlefield(s, ids, 'graveyard');
  } else if ('exile' in e) {
    leaveBattlefield(s, objs(s, e.exile, ctx).map((o) => o.id), 'exile');
  } else if ('bounce' in e) {
    const targets = objs(s, e.bounce, ctx);
    leaveBattlefield(s, targets.filter((o) => o.zone === 'battlefield').map((o) => o.id), 'hand');
    for (const o of targets) if (o.zone.endsWith('.graveyard')) move(s, o.id, zoneOf(o.owner, 'hand')); // "return this card from your graveyard"
  } else if ('sacrifice' in e) {
    leaveBattlefield(s, objs(s, e.sacrifice, ctx).filter((o) => o.controller === ctx.controller).map((o) => o.id), 'graveyard');
  } else if ('tap' in e) {
    for (const o of objs(s, e.tap, ctx)) tap(s, o.id);
  } else if ('untap' in e) {
    for (const o of objs(s, e.untap, ctx)) o.tapped = false;
  } else if ('createToken' in e) {
    const [p = ctx.controller] = e.controller ? players(s, e.controller, ctx) : [ctx.controller];
    const k = n(e.n);
    for (let i = 0; i < k; i++) {
      const id = createToken(s, e.createToken, p, { tapped: !!e.tapped || !!e.attacking });
      if (s.resolving) s.resolving.created = id;
      // 506.3d: a token put onto the battlefield attacking attacks the player it is told to, and was never declared.
      if (e.attacking && s.objects[id]) s.objects[id]!.attacking = other(p);
    }
    event(s, `${name(s, p)} creates ${k} ${s.setup.cards[e.createToken]!.name} token${k > 1 ? 's' : ''}`);
  } else if ('addMana' in e) {
    if (e.anyColor) throw new Error('mana of any colour is chosen by the payment solver; the vocabulary adds it with M4');
    const k = e.n === undefined ? 1 : n(e.n);
    const pool = e.untilEndOfCombat ? s.players[ctx.controller].combatPool : s.players[ctx.controller].pool;
    for (const c of e.addMana) pool[c] += k;
  } else if ('earthbend' in e) {
    for (const o of objs(s, e.on, ctx)) {
      addEffect(s, ctx, { affects: 'self', addTypes: ['Creature'], setBase: [0, 0], addKeywords: ['haste'], earthbent: true }, [o.id], 'permanent');
      event(s, `${v(o).name} is earthbent`);
      addCounters(s, o.id, '+1/+1', n(e.earthbend));
    }
  } else if ('airbend' in e) {
    for (const o of objs(s, e.airbend, ctx)) {
      event(s, `${v(o).name} is airbent`);
      for (const id of leaveBattlefield(s, [o.id], 'exile')) s.objects[id]!.airbended = true;
    }
  } else if ('returnToBattlefield' in e) {
    for (const o of objs(s, e.returnToBattlefield, ctx)) {
      if (o.zone === 'battlefield' || o.zone === 'stack') continue;
      event(s, `${characteristics(s, o).name} returns to the battlefield`);
      putOntoBattlefield(s, o.id, ctx.controller, { tapped: !!e.tapped });
    }
  } else if ('scry' in e || 'surveil' in e) {
    // 701.22, 701.25: the player looks at the top cards (privately) and decides where each goes.
    const p = ctx.controller;
    const lib = s.zones[zoneOf(p, 'library')];
    const k = Math.min(n('scry' in e ? e.scry : e.surveil), lib.length);
    if (k === 0) return 'next';
    const top = lib.slice(lib.length - k).reverse(); // top first
    if (!choice) { s.decision = { kind: 'arrange', player: p, cards: top, to: 'scry' in e ? 'bottom' : 'graveyard' }; return 'wait'; }
    if (choice.kind !== 'arrange') throw new Error('expected an arrangement');
    const away = choice.away;
    const rest = lib.slice(0, lib.length - k);
    if ('scry' in e) s.zones[zoneOf(p, 'library')] = [...[...away].reverse(), ...rest, ...[...choice.top].reverse()];
    else {
      for (const id of away) move(s, id, zoneOf(p, 'graveyard')); // from the library as it is
      s.zones[zoneOf(p, 'library')] = [...rest, ...[...choice.top].reverse()];
    }
    event(s, `${name(s, p)} ${'scry' in e ? 'scries' : 'surveils'} ${k}: ${choice.top.length} on top, ${away.length} ${'scry' in e ? 'on the bottom' : 'into the graveyard'}`);
  } else if ('search' in e) {
    const p = ctx.controller;
    const options = s.zones[zoneOf(p, 'library')].filter((id) => matches(s, v, s.objects[id]!, { ...e.search, zone: 'library' }, ctx));
    if (!choice) { s.decision = { kind: 'search', player: p, options, max: e.n ?? 1 }; return 'wait'; }
    if (choice.kind !== 'search') throw new Error('expected a search');
    for (const id of choice.cards) {
      event(s, `${name(s, p)} finds ${characteristics(s, obj(s, id)).name}`);
      if (e.to === 'hand') move(s, id, zoneOf(p, 'hand')); else putOntoBattlefield(s, id, p, { tapped: !!e.tapped });
    }
    shuffleLibrary(s, p);
  } else if ('optional' in e) {
    const p = ctx.controller;
    const pay = e.optional.sacrifice ? 'sacrifice' : 'discard';
    const options = e.optional.sacrifice
      ? select(s, v, { ...e.optional.sacrifice, controller: 'you' }, ctx).map((o) => o.id)
      : [...s.zones[zoneOf(p, 'hand')]];
    const count = e.optional.discard ?? 1;
    if (options.length < count) return 'next'; // can't pay, so can't do it
    if (!choice) { s.decision = { kind: 'optionalCost', player: p, pay, options, count }; return 'wait'; }
    if (choice.kind !== 'optionalCost') throw new Error('expected an optional cost');
    if (!choice.objects.length) return 'next';
    if (pay === 'sacrifice') leaveBattlefield(s, choice.objects, 'graveyard');
    else for (const id of choice.objects) { event(s, `${name(s, p)} discards ${characteristics(s, obj(s, id)).name}`); move(s, id, zoneOf(p, 'graveyard')); }
    splice(s, e.then);
  } else if ('fight' in e) {
    const [a] = objs(s, e.fight[0], ctx), [b] = objs(s, e.fight[1], ctx);
    // 701.14b: if either is no longer a creature on the battlefield, no damage is dealt.
    if (a && b && v(a).types.includes('Creature') && v(b).types.includes('Creature')) {
      const pa = v(a).power, pb = v(b).power;
      dealDamage(s, a.id, b.id, pa);
      dealDamage(s, b.id, a.id, pb);
    }
  } else if ('counterUnlessPays' in e) {
    for (const t of recipients(s, e.on, ctx)) {
      const o = !isPlayer(t) ? s.objects[t] : undefined;
      if (!o || o.zone !== 'stack') continue;
      if (!choice) { s.decision = { kind: 'payOrElse', player: o.controller, cost: e.counterUnlessPays, otherwise: `${characteristics(s, o).name} is countered` }; return 'wait'; }
      if (choice.kind === 'yes') { event(s, `${name(s, o.controller)} pays ${e.counterUnlessPays}`); continue; }
      event(s, `${characteristics(s, o).name} is countered`);
      move(s, o.id, zoneOf(o.owner, 'graveyard'));
    }
  } else if ('extraLand' in e) {
    s.players[ctx.controller].extraLands += e.extraLand;
  } else if ('attach' in e) {
    const [to] = objs(s, e.attach, ctx);
    const self = s.objects[ctx.source];
    if (to && self && self.zone === 'battlefield' && to.zone === 'battlefield') { self.attachedTo = to.id; event(s, `${v(self).name} is attached to ${v(to).name}`); }
  } else if ('shuffleIntoLibrary' in e) {
    for (const o of objs(s, e.shuffleIntoLibrary, ctx)) {
      const owner = o.owner;
      leaveBattlefield(s, [o.id], 'library');
      shuffleLibrary(s, owner);
    }
  } else if ('putCountersOf' in e) {
    const all = countersOf(s, v, e.putCountersOf, ctx);
    for (const o of objs(s, e.on, ctx)) for (const c of all) for (const [kind, k] of Object.entries(c)) addCounters(s, o.id, kind, k);
  } else if ('lookAtTop' in e) {
    const p = ctx.controller;
    const lib = s.zones[zoneOf(p, 'library')];
    if (!choice) {
      const k = Math.min(n(e.lookAtTop), lib.length);
      let seen = lib.slice(lib.length - k).reverse(); // top first
      const r = s.resolving!;
      if (e.rest === 'mill') { seen = seen.map((id) => move(s, id, zoneOf(p, 'graveyard')).id); event(s, `${name(s, p)} mills ${k}`); }
      r.looked = seen;
      const options = seen.filter((id) => matches(s, v, s.objects[id]!, { ...e.mayTake, zone: e.rest === 'mill' ? 'graveyard' : 'library' }, ctx));
      s.decision = { kind: 'pick', player: p, from: seen, options, min: 0, max: 1, text: e.rest === 'mill' ? 'You may put one into your hand' : 'You may reveal one and put it into your hand' };
      return 'wait';
    }
    if (choice.kind !== 'pick') throw new Error('expected a pick');
    const r = s.resolving!;
    const seen = r.looked ?? [];
    delete r.looked;
    for (const id of choice.cards) { event(s, `${name(s, p)} ${e.rest === 'mill' ? 'takes' : 'reveals'} ${characteristics(s, obj(s, id)).name} and puts it into their hand`); move(s, id, zoneOf(p, 'hand')); }
    if (e.rest === 'bottomRandom') {
      const [rest, rng] = shuffle(s.rng, seen.filter((id) => !choice.cards.includes(id)));
      s.rng = rng;
      const keep = s.zones[zoneOf(p, 'library')].filter((id) => !rest.includes(id));
      s.zones[zoneOf(p, 'library')] = [...rest, ...keep]; // the bottom is the first element
    }
    if (!choice.cards.length && e.otherwise) splice(s, e.otherwise);
  } else if ('revealAndDiscard' in e) {
    for (const q of players(s, e.revealAndDiscard, ctx)) {
      const shown = [...s.zones[zoneOf(q, 'hand')]];
      const options = shown.filter((id) => matches(s, v, s.objects[id]!, { ...e.choose, zone: 'hand' }, ctx));
      if (!choice) {
        event(s, `${name(s, q)} reveals their hand`);
        if (!options.length) continue;
        s.decision = { kind: 'pick', player: ctx.controller, from: shown, options, min: 1, max: 1, text: `Choose a card for ${name(s, q)} to discard` };
        return 'wait';
      }
      if (choice.kind !== 'pick') throw new Error('expected a pick');
      for (const id of choice.cards) { event(s, `${name(s, q)} discards ${characteristics(s, obj(s, id)).name}`); move(s, id, zoneOf(q, 'graveyard')); }
    }
  } else if ('exileTopPlayable' in e) {
    const p = ctx.controller;
    const id = top(s, p);
    if (id) {
      const o = move(s, id, zoneOf(p, 'exile'));
      o.playableTurn = s.turn;
      event(s, `${name(s, p)} exiles ${characteristics(s, o).name} from the top of their library; they may play it this turn`);
    }
  } else if ('unlessPays' in e) {
    const cost = e.unlessPays.mana ?? '';
    if (!choice) { s.decision = { kind: 'payOrElse', player: ctx.controller, cost, ...(e.unlessPays.waterbend ? { waterbend: e.unlessPays.waterbend } : {}), otherwise: describe(e.then) }; return 'wait'; }
    if (choice.kind === 'no') splice(s, e.then);
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
