/**
 * What the board draws (PRD, "Board layout"), as plain data computed from a game state. Pure, so
 * it is tested without a browser; components only lay it out. Nothing here reveals a hidden card:
 * hands and libraries appear as counts, except the one hand the session says may show.
 */
import { pool } from '../cards/pool';
import { characteristics, summoningSick } from '../engine/characteristics';
import { tapForMana } from '../engine/engine';
import { triggeredAbility } from '../engine/triggers';
import type { Color, GameObject, GameState, ManaSymbol, ObjectId, PlayerId, Step, Target } from '../engine/types';
import { COLORS, other } from '../engine/types';

export const imageOf = (s: GameState, id: ObjectId): string => cardImage(s.objects[id]!.card);

/** A card's image by its card id (a trigger's source may have left the game). */
export const cardImage = (card: string): string => {
  const c = pool.cards[card];
  return c ? `${import.meta.env.BASE_URL}cards/${c.image}` : '';
};

/** A mana cost in the usual braces: {2}{R}, {W/U}, with X as chosen. */
export function formatCost(cost: ManaSymbol[], x = 0): string {
  return cost.map((m) => {
    switch (m.kind) {
      case 'generic': return `{${m.amount}}`;
      case 'color': return `{${m.color}}`;
      case 'hybrid': return `{${m.colors.join('/')}}`;
      case 'colorless': return '{C}';
      case 'x': return `{${x}}`;
    }
  }).join('');
}

export const nameOf = (s: GameState, id: ObjectId) => characteristics(s, s.objects[id]!).name;
export const playerName = (s: GameState, p: PlayerId) => s.setup.players[p].name;

export interface Stats {
  player: PlayerId;
  name: string;
  life: number;
  hand: number;
  library: number;
  graveyard: number;
  /** Lesson cards in the graveyard, which several cards count. */
  lessons: number;
  exile: number;
  /** Exiled cards the player may cast or play now: the Exile icon glows. */
  exileUsable: boolean;
}

export function stats(s: GameState, p: PlayerId): Stats {
  const grave = s.zones[`${p}.graveyard`];
  const exile = s.zones[`${p}.exile`];
  return {
    player: p, name: playerName(s, p), life: s.players[p].life,
    hand: s.zones[`${p}.hand`].length, library: s.zones[`${p}.library`].length,
    graveyard: grave.length, lessons: grave.filter((id) => characteristics(s, s.objects[id]!).subtypes.includes('Lesson')).length,
    exile: exile.length, exileUsable: exile.some((id) => s.objects[id]!.airbended || s.objects[id]!.playableTurn === s.turn),
  };
}

const isCreature = (s: GameState, o: GameObject) => characteristics(s, o).types.includes('Creature');
const isLand = (s: GameState, o: GameObject) => characteristics(s, o).types.includes('Land');

/** One chip per land name: "Mountain ×3", a pip per land, dimmed when tapped. */
export interface LandChip { name: string; ids: ObjectId[]; pips: { color: Color | 'C'; tapped: boolean }[] }

/** The lands strip: lands that aren't creatures, grouped by name, and the mana still open. */
export function landsStrip(s: GameState, p: PlayerId): { chips: LandChip[]; open: (Color | 'C')[]; floating: (Color | 'C')[] } {
  const chips = new Map<string, LandChip>();
  const open: (Color | 'C')[] = [];
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    if (o.controller !== p || !isLand(s, o) || isCreature(s, o)) continue;
    const name = characteristics(s, o).name;
    const makes = tapForMana(s, id)?.makes ?? [];
    const color = makes.length === 1 ? makes[0]! : 'C';
    const chip = chips.get(name) ?? { name, ids: [], pips: [] };
    chip.ids.push(id);
    chip.pips.push({ color, tapped: o.tapped });
    chips.set(name, chip);
    if (!o.tapped && makes.length) open.push(color);
  }
  const floating: (Color | 'C')[] = [];
  for (const pool of [s.players[p].pool, s.players[p].combatPool]) for (const c of [...COLORS, 'C'] as const) for (let i = 0; i < pool[c]; i++) floating.push(c);
  return { chips: [...chips.values()], open, floating };
}

export interface Permanent {
  id: ObjectId;
  name: string;
  image: string;
  tapped: boolean;
  /** Power and toughness, with how they compare to the printed values. */
  pt?: { power: number; toughness: number; up: boolean; down: boolean };
  damage: number;
  counters: [string, number][];
  attacking: boolean;
  blocking: boolean;
  /** A creature with summoning sickness (302.6): it can't attack or use {T} abilities yet. */
  sick: boolean;
  controller: PlayerId;
  /** Auras and Equipment attached to it, drawn to its left, linked (whoever controls them). */
  attached: Permanent[];
}

function permanentOf(s: GameState, id: ObjectId): Permanent {
  const o = s.objects[id]!;
  const c = characteristics(s, o);
  const printed = s.setup.cards[o.card]!;
  const creature = c.types.includes('Creature');
  const sum = c.power + c.toughness, base = (printed.power ?? 0) + (printed.toughness ?? 0);
  return {
    id, name: c.name, image: imageOf(s, id), tapped: o.tapped, controller: o.controller,
    ...(creature ? { pt: { power: c.power, toughness: c.toughness, up: sum > base, down: sum < base } } : {}),
    damage: o.damage, counters: Object.entries(o.counters).filter(([, n]) => n > 0),
    attacking: o.attacking !== undefined, blocking: !!o.blocking?.length, sick: creature && summoningSick(s, o),
    attached: s.zones.battlefield.filter((a) => s.objects[a]!.attachedTo === id).map((a) => permanentOf(s, a)),
  };
}

/** Whether a permanent is attached to something on the battlefield: it is drawn with that, not on its own. */
const attachedToSomething = (s: GameState, o: GameObject) => !!o.attachedTo && s.objects[o.attachedTo]?.zone === 'battlefield';

/** A player's battlefield row: creatures and other non-land permanents; earthbent lands move here while creatures. */
export function battlefieldRow(s: GameState, p: PlayerId): Permanent[] {
  const out: Permanent[] = [];
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    if (o.controller !== p) continue;
    if (isLand(s, o) && !isCreature(s, o)) continue;
    if (attachedToSomething(s, o)) continue; // drawn with what it's attached to
    out.push(permanentOf(s, id));
  }
  return out;
}

export interface StackItem {
  id: ObjectId;
  /** 1 is the top, which resolves first. */
  n: number;
  name: string;
  image: string;
  controller: PlayerId;
  /** The ability's text, for an ability; the card's name, for a spell. */
  text: string;
  targets: string;
  /** Every target it had has left or become illegal: it will do nothing. */
  targetsGone: boolean;
}

const targetName = (s: GameState, t: Target) => (t === 'p1' || t === 'p2' ? playerName(s, t) : s.objects[t] ? nameOf(s, t) : null);

/** The stack, top first. */
export function stackItems(s: GameState): StackItem[] {
  const ids = [...s.zones.stack].reverse();
  return ids.map((id, i) => {
    const o = s.objects[id]!;
    const a = o.ability;
    const script = s.setup.cards[o.card]?.script;
    const text = a ? (a.kind === 'activated' ? script?.activated?.[a.index]?.text : triggeredAbility(s, o.card, a.index).text) ?? '' : '';
    const chosen = (o.targets ?? []).flat();
    const names = chosen.map((t) => targetName(s, t));
    return {
      id, n: i + 1, name: a ? a.sourceName : nameOf(s, id), image: imageOf(s, id), controller: o.controller, text,
      targets: names.filter((x): x is string => !!x).join(', '),
      targetsGone: chosen.length > 0 && names.every((x) => x === null),
    };
  });
}

/** Target rings (PRD, "Showing targets"): for each object or player targeted, the stack items aiming at it. */
export function targetRings(s: GameState): Map<Target, { n: number; controller: PlayerId }[]> {
  const rings = new Map<Target, { n: number; controller: PlayerId }[]>();
  for (const item of stackItems(s)) {
    for (const t of (s.objects[item.id]!.targets ?? []).flat()) {
      if (t !== 'p1' && t !== 'p2' && !s.objects[t]) continue;
      rings.set(t, [...(rings.get(t) ?? []), { n: item.n, controller: item.controller }]);
    }
  }
  return rings;
}

const STEP_NAMES: Record<Step, string> = {
  untap: 'Untap', upkeep: 'Upkeep', draw: 'Draw', main1: 'Main 1', beginCombat: 'Beginning of combat',
  attackers: 'Combat: attackers declared', blockers: 'Combat: blockers declared', firstStrikeDamage: 'Combat: first-strike damage',
  damage: 'Combat damage', endCombat: 'End of combat', main2: 'Main 2', end: 'End step', cleanup: 'Cleanup',
};

/** The centre band's turn line: "Turn 3 · Lawrence · Combat: blockers declared". */
export function turnLine(s: GameState, short = false): string {
  if (s.turn === 0) return 'Mulligans';
  const step = STEP_NAMES[s.step];
  return short ? `T${s.turn} · ${playerName(s, s.active)} · ${step.replace(/^Combat: /, '')}` : `Turn ${s.turn} · ${playerName(s, s.active)} · ${step}`;
}

/** What passing priority does now: "Pass: Fists of Flame resolves", "Pass: go to combat". */
export function passMeaning(s: GameState): string {
  const top = s.zones.stack[s.zones.stack.length - 1];
  if (top) {
    const name = stackItems(s)[0]!.name;
    return s.passes === 1 ? `${name} resolves` : `${playerName(s, other(s.priority!))} may respond to ${name}`;
  }
  const next: Partial<Record<Step, string>> = {
    main1: s.priority === s.active ? 'go to combat' : 'next step', attackers: 'go to blocks', blockers: 'combat damage',
    main2: 'end the turn', end: 'next turn',
  };
  return next[s.step] ?? 'next step';
}

/** "4/6 = 2/4 printed, +1/+1 counter, +1/+1 from Iroh until end of turn" (PRD, "Auto-tallied numbers"). */
export function ptBreakdown(s: GameState, id: ObjectId): string {
  const c = characteristics(s, s.objects[id]!);
  const sign = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);
  const parts = c.parts.map((p) => (p.set ? `${p.power}/${p.toughness} ${p.label}` : `${sign(p.power)}/${sign(p.toughness)} ${p.label}`));
  return `${c.power}/${c.toughness} = ${parts.join(', ')}`;
}

/**
 * The cards a full view steps through with a sideways swipe, in the order the board shows them:
 * the row or strip a permanent sits in, the stack top first, a hand, a pile newest first. Only
 * cards the viewer already sees are listed: a hand's cards only when that hand is shown.
 */
export function siblings(s: GameState, id: ObjectId, shownHand: PlayerId | null): ObjectId[] {
  const o = s.objects[id];
  if (!o) return [];
  if (o.zone === 'stack') return stackItems(s).map((i) => i.id);
  if (o.zone === 'battlefield') {
    // In a row, a card's attachments come just before it, as drawn.
    const host = o.attachedTo && s.objects[o.attachedTo] ? s.objects[o.attachedTo]! : o;
    const row = battlefieldRow(s, host.controller).flatMap((p) => [...p.attached.map((a) => a.id), p.id]);
    if (row.includes(id)) return row;
    const lands = landsStrip(s, o.controller).chips.flatMap((c) => c.ids);
    if (lands.includes(id)) return lands;
    return [id];
  }
  const [p, zone] = o.zone.split('.') as [PlayerId, string];
  if (zone === 'hand') return p === shownHand ? [...s.zones[o.zone]] : [];
  return [...s.zones[o.zone]].reverse();
}

/** A change to pulse: a creature's numbers or counters, a life total, a permanent arriving. */
export interface Pulse { label: string; kind: 'up' | 'down' | 'info' }

/** One step of playback: a spell or ability resolving, or combat damage, and what it changed. */
export interface Beat {
  /** The index of the state just after it, in the game's list of states. */
  at: number;
  title: string;
  /** The source's picture (absent for combat damage), its controller, and the text that did it. */
  image?: string;
  /** The spell or ability that resolved, as it was on the stack in the state before (states[at - 1]). */
  object?: ObjectId;
  controller?: PlayerId;
  text?: string;
  /** What else happened in that step, as the log says it ("Sokka dies"). */
  lines: string[];
  pulses: Map<Target, Pulse>;
}

const sign = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/** What changed on the board from one state to the next, by object or player. */
export function changes(a: GameState, b: GameState): Map<Target, Pulse> {
  const out = new Map<Target, Pulse>();
  const add = (t: Target, label: string, kind: Pulse['kind']) => {
    const was = out.get(t);
    out.set(t, was ? { label: `${was.label} · ${label}`, kind: was.kind === kind ? kind : 'info' } : { label, kind });
  };
  for (const p of ['p1', 'p2'] as const) {
    const d = b.players[p].life - a.players[p].life;
    if (d) add(p, sign(d), d > 0 ? 'up' : 'down');
  }
  const before = new Set(a.zones.battlefield);
  for (const id of b.zones.battlefield) {
    const ob = b.objects[id]!;
    if (!before.has(id)) { add(id, 'enters', 'info'); continue; }
    const oa = a.objects[id]!;
    const ca = characteristics(a, oa), cb = characteristics(b, ob);
    const counter = (k: string) => (ob.counters[k] ?? 0) - (oa.counters[k] ?? 0);
    // Counters are named as counters, so the power and toughness they add isn't named twice.
    const fromCounters = counter('+1/+1') - counter('-1/-1');
    if (cb.types.includes('Creature') && ca.types.includes('Creature')) {
      const dp = cb.power - ca.power - fromCounters, dt = cb.toughness - ca.toughness - fromCounters;
      if (dp || dt) add(id, `${sign(dp)}/${sign(dt)}`, dp + dt >= 0 ? 'up' : 'down');
    }
    if (!ca.types.includes('Creature') && cb.types.includes('Creature')) add(id, 'becomes a creature', 'info');
    for (const k of new Set([...Object.keys(oa.counters), ...Object.keys(ob.counters)])) {
      const d = counter(k);
      if (!d) continue;
      const pt = k === '+1/+1' || k === '-1/-1';
      const n = pt ? `${sign(k === '+1/+1' ? d : -d)}/${sign(k === '+1/+1' ? d : -d)}` : `${sign(d)} ${k}`;
      add(id, `${n} counter${Math.abs(d) > 1 ? 's' : ''}`, (k === '-1/-1' || k === 'stun') === d > 0 ? 'down' : 'up');
    }
    const dmg = ob.damage - oa.damage;
    if (dmg > 0) add(id, `${dmg} damage`, 'down');
    for (const kw of cb.keywords) if (!ca.keywords.includes(kw)) add(id, kw, 'up');
  }
  return out;
}

const RESOLVES = / resolves$| does nothing: /;

/**
 * The steps worth playing back between two points of a game (PRD, "Playing"): each spell or
 * ability that resolved, and each round of combat damage, with what it changed. Passes and
 * everything else that changes nothing on the board are skipped. Only public facts are used.
 */
export function beats(states: readonly GameState[], from: number, to: number): Beat[] {
  const out: Beat[] = [];
  for (let i = from + 1; i <= to; i++) {
    const a = states[i - 1]!, b = states[i]!;
    const fresh = b.events.slice(a.events.length).map((e) => e.text);
    const resolved = fresh.find((t) => RESOLVES.test(t));
    const top = a.zones.stack[a.zones.stack.length - 1];
    // Damage dealt without anything resolving is combat damage (the only other kind comes from a resolution).
    const combat = !resolved && fresh.some((t) => / deals \d+ damage to /.test(t));
    if (!resolved && !combat) continue;
    const lines = fresh.filter((t) => !RESOLVES.test(t)).slice(0, 4);
    if (resolved && top && a.objects[top]) {
      const o = a.objects[top]!;
      const ab = o.ability;
      const script = a.setup.cards[o.card]?.script;
      // A permanent spell's text is what the permanent does later; its resolving is just "enters".
      const permanent = !ab && ['Creature', 'Artifact', 'Enchantment', 'Land', 'Planeswalker', 'Battle'].some((t) => characteristics(a, o).types.includes(t));
      const text = ab ? (ab.kind === 'activated' ? script?.activated?.[ab.index]?.text : triggeredAbility(a, o.card, ab.index).text) : permanent ? '' : a.setup.cards[o.card]!.text;
      out.push({
        at: i, title: ab ? `${ab.sourceName}'s ability` : nameOf(a, top), image: imageOf(a, top), object: top, controller: o.controller,
        text: resolved.includes(' does nothing: ') ? 'Its target is gone: it does nothing.' : text ?? '', lines, pulses: changes(a, b),
      });
    } else out.push({ at: i, title: 'Combat damage', lines, pulses: changes(a, b) });
  }
  return out;
}
