/**
 * The card pool as the app bundles it (technical design, "Card data"). Built from the v2 deck
 * export by scripts/build-cards.ts into src/cards/cards.json; the images go to public/cards/.
 */

/** One printing of a card, as Scryfall describes it. The engine reads its printed values. */
export interface CardPrinting {
  /** The Scryfall id: one per printing, stable across exports. */
  id: string;
  /** The Oracle id: the same for every printing of a card; card scripts are keyed by it. */
  oracleId: string;
  name: string;
  /** In Scryfall's notation, e.g. "{1}{W/U}{W/U}"; empty for lands. */
  manaCost: string;
  manaValue: number;
  typeLine: string;
  oracleText: string;
  /** Printed power and toughness, as text ("2", "*"), on creatures and Vehicles only. */
  power?: string;
  toughness?: string;
  colors: string[];
  colorIdentity: string[];
  keywords: string[];
  /** Scryfall's layout: "normal", "saga" or "token" in this pool. */
  layout: string;
  set: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  /** The large front image: a file name in public/cards/, named by its SHA-256. */
  image: string;
  token: boolean;
}

/** One Wizards of the Coast ruling on a card. */
export interface Ruling {
  date: string;
  text: string;
}

/** A 20-card Beginner Box deck or Jumpstart packet. A player's deck is three of them. */
export interface Packet {
  /** A stable slug of the name, e.g. "js-firebending-1". */
  id: string;
  /** As in the export, e.g. "Avatar JS: Firebending (1)". */
  name: string;
  product: 'Beginner Box' | 'Jumpstart';
  /** Printing ids, one per card, in the export's order. */
  cards: string[];
}

export interface CardPool {
  /** When the v2 export this pool was built from was made. */
  exportedAt: string;
  packets: Packet[];
  /** Every printing in a packet or a token list, by printing id. */
  cards: Record<string, CardPrinting>;
  /** The token printings the packets can make, by printing id. */
  tokens: string[];
  /** Rulings by Oracle id; cards without rulings are left out. */
  rulings: Record<string, Ruling[]>;
}
