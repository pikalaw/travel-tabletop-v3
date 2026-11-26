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
  /** Auras attached to it, tucked behind. */
  auras: { id: ObjectId; image: string; controller: PlayerId }[];
  /** For Equipment: what it is attached to. */
  attachedTo?: string;
}

/** A player's battlefield row: creatures and other non-land permanents; earthbent lands move here while creatures. */
export function battlefieldRow(s: GameState, p: PlayerId): Permanent[] {
  const out: Permanent[] = [];
  for (const id of s.zones.battlefield) {
    const o = s.objects[id]!;
    const c = characteristics(s, o);
    if (o.controller !== p) continue;
    if (isLand(s, o) && !isCreature(s, o)) continue;
    if (c.subtypes.includes('Aura') && o.attachedTo && s.objects[o.attachedTo]) continue; // drawn with what it enchants
    const printed = s.setup.cards[o.card]!;
    const creature = c.types.includes('Creature');
    const sum = c.power + c.toughness, base = (printed.power ?? 0) + (printed.toughness ?? 0);
    out.push({
      id, name: c.name, image: imageOf(s, id), tapped: o.tapped,
      ...(creature ? { pt: { power: c.power, toughness: c.toughness, up: sum > base, down: sum < base } } : {}),
      damage: o.damage, counters: Object.entries(o.counters).filter(([, n]) => n > 0),
      attacking: o.attacking !== undefined, blocking: !!o.blocking?.length, sick: creature && summoningSick(s, o),
      auras: s.zones.battlefield.filter((a) => s.objects[a]!.attachedTo === id && characteristics(s, s.objects[a]!).subtypes.includes('Aura'))
        .map((a) => ({ id: a, image: imageOf(s, a), controller: s.objects[a]!.controller })),
      ...(o.attachedTo && s.objects[o.attachedTo] ? { attachedTo: nameOf(s, o.attachedTo) } : {}),
    });
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
