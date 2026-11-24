import { parseCost } from '../engine/mana';
import type { Color, Printed } from '../engine/types';
import type { CardPrinting } from './types';

const SUPERTYPES = ['Legendary', 'Basic', 'Snow', 'World'];

/** A card's printed characteristics in the engine's terms, from its bundled card data. */
export function printedOf(c: CardPrinting): Printed {
  const [left = '', right = ''] = c.typeLine.split('—').map((x) => x.trim());
  const words = left.split(/\s+/).filter(Boolean);
  const num = (v?: string) => (v === undefined ? undefined : /^\d+$/.test(v) ? Number(v) : 0);
  const power = num(c.power), toughness = num(c.toughness);
  return {
    name: c.name,
    oracleId: c.oracleId,
    manaCost: parseCost(c.manaCost),
    supertypes: words.filter((w) => SUPERTYPES.includes(w)),
    types: words.filter((w) => !SUPERTYPES.includes(w) && w !== 'Token'),
    subtypes: right ? right.split(/\s+/) : [],
    ...(power !== undefined ? { power } : {}),
    ...(toughness !== undefined ? { toughness } : {}),
    keywords: c.keywords,
    colors: c.colors as Color[],
    text: c.oracleText,
  };
}
