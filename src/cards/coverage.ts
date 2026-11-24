/**
 * Which cards the engine supports (PRD, "Supported cards only"). A card is playable when its rules
 * are all handled: a vanilla card, or one whose text is only keywords the engine implements, needs
 * nothing more; any other card needs a script (and every script has a card test, which a test
 * enforces). A packet is playable when all its cards are.
 */
import { pool } from './pool';
import { scripts } from './registry';
import type { CardPrinting, Packet } from './types';

/** Keywords the engine implements wherever a card has them. */
export const ENGINE_KEYWORDS = ['flying', 'vigilance', 'reach', 'menace', 'defender', 'first strike', 'double strike', 'trample',
  'deathtouch', 'lifelink', 'haste', 'flash', 'hexproof', 'prowess'];

export type Coverage = 'vanilla' | 'scripted' | 'missing';

/** Oracle text without reminder text, split into ability lines. */
export const abilityLines = (c: CardPrinting) =>
  c.oracleText.replace(/\([^)]*\)/g, '').split('\n').map((l) => l.trim()).filter(Boolean);

const keywordOnly = (line: string) => line.split(/,\s*/).every((k) => ENGINE_KEYWORDS.includes(k.toLowerCase()));

export function coverage(c: CardPrinting): Coverage {
  if (scripts.has(c.oracleId)) return 'scripted';
  return abilityLines(c).every(keywordOnly) ? 'vanilla' : 'missing';
}

export const playable = (c: CardPrinting) => coverage(c) !== 'missing';

export function packetPlayable(p: Packet): boolean {
  return p.cards.every((id) => playable(pool.cards[id]!));
}
