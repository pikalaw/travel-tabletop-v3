import type { CardScript } from '../engine/abilities';

/** Declares a card's script. Each file in scripts/ exports one; the registry keys them by Oracle id. */
export const card = (script: CardScript): CardScript => script;
