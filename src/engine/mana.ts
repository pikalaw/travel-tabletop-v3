/**
 * Mana costs and the payment solver (technical design, "The mana payment solver"). Paying a cost
 * is a bipartite matching: each coloured or hybrid symbol needs one source that can make one of its
 * colours, and the generic part takes any sources left. A maximum matching (augmenting paths)
 * decides whether the cost can be paid at all; ordering the sources decides which get used.
 */
import type { Color, ManaSymbol } from './types';
import { COLORS } from './types';

const isColor = (s: string): s is Color => (COLORS as readonly string[]).includes(s);

/** Parses Scryfall notation such as "{2}{W/U}{R}". */
export function parseCost(text: string): ManaSymbol[] {
  const out: ManaSymbol[] = [];
  for (const [, sym] of text.matchAll(/\{([^}]+)\}/g)) {
    const s = sym!;
    if (/^\d+$/.test(s)) out.push({ kind: 'generic', amount: Number(s) });
    else if (s === 'X') out.push({ kind: 'x' });
    else if (s === 'C') out.push({ kind: 'colorless' });
    else if (isColor(s)) out.push({ kind: 'color', color: s });
    else {
      const [a, b] = s.split('/');
      if (a && b && isColor(a) && isColor(b)) out.push({ kind: 'hybrid', colors: [a, b] });
      else throw new Error(`unsupported mana symbol {${s}}`);
    }
  }
  return out;
}

export function manaValue(cost: readonly ManaSymbol[]): number {
  return cost.reduce((n, s) => n + (s.kind === 'generic' ? s.amount : s.kind === 'x' ? 0 : 1), 0);
}

/** Something that can make one mana: an untapped land, or a unit of floating mana. */
export interface ManaSource {
  id: string;
  /** The kinds of mana it can make; C is colourless. */
  makes: readonly (Color | 'C')[];
  /** Floating mana is spent before anything is tapped. */
  floating?: boolean;
}

/** Which source pays which symbol: indexes into the cost's non-generic symbols, then generic. */
export interface Payment { sources: string[] }

/**
 * Finds a way to pay `cost` from `sources`, or null when there is none. X is paid as 0. Sources
 * are preferred in this order: floating mana, then sources that make fewer kinds of mana, so that
 * flexible sources stay untapped; ties keep the given order, which makes the result deterministic.
 */
export function solvePayment(cost: readonly ManaSymbol[], sources: readonly ManaSource[]): Payment | null {
  const order = sources
    .map((s, i) => ({ s, i }))
    .sort((a, b) => Number(!!b.s.floating) - Number(!!a.s.floating) || a.s.makes.length - b.s.makes.length || a.i - b.i)
    .map((x) => x.s);
  const needs = cost.flatMap((sym): (readonly (Color | 'C')[])[] =>
    sym.kind === 'color' ? [[sym.color]] : sym.kind === 'hybrid' ? [sym.colors] : sym.kind === 'colorless' ? [['C']] : []);
  const generic = cost.reduce((n, s) => n + (s.kind === 'generic' ? s.amount : 0), 0);
  if (needs.length + generic > order.length) return null;

  // Kuhn's augmenting paths: matchOf[source] = the symbol it pays.
  const matchOf = new Array<number>(order.length).fill(-1);
  const can = (src: number, need: number) => needs[need]!.some((m) => order[src]!.makes.includes(m));
  const augment = (need: number, seen: boolean[]): boolean => {
    for (let src = 0; src < order.length; src++) {
      if (seen[src] || !can(src, need)) continue;
      seen[src] = true;
      if (matchOf[src] === -1 || augment(matchOf[src]!, seen)) { matchOf[src] = need; return true; }
    }
    return false;
  };
  for (let need = 0; need < needs.length; need++) {
    if (!augment(need, new Array<boolean>(order.length).fill(false))) return null;
  }
  const used = order.filter((_, i) => matchOf[i] !== -1);
  const spare = order.filter((_, i) => matchOf[i] === -1);
  if (spare.length < generic) return null;
  return { sources: [...used, ...spare.slice(0, generic)].map((s) => s.id) };
}
