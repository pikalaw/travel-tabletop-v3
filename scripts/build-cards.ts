/**
 * Builds the bundled card pool from the v2 deck export (technical design, "Card data").
 *
 *   node scripts/build-cards.ts path/to/unzipped-v2-export
 *
 * Reads the export's manifest.json and images/, and writes:
 * - src/cards/cards.json: the packets, every card's printed values, the tokens and the rulings;
 * - public/cards/<sha256>.jpg: each card's large front image, checked against its hash.
 * Files in public/cards/ that the pool no longer uses are removed. The output is committed, so
 * builds never need the export; rerun this only when the export changes.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CardPool, CardPrinting, Packet, Ruling } from '../src/cards/types';

interface ExportDef {
  id: string;
  name: string;
  scryfallId: string;
  back: string | null;
  sizes: { front: { small: string; large: string }; back: unknown };
  text: { oracleId: string; layout: string; record: ScryfallCard };
}
interface ScryfallCard {
  id: string; oracle_id: string; name: string; mana_cost?: string; cmc: number; type_line: string;
  oracle_text?: string; power?: string; toughness?: string; colors?: string[]; color_identity: string[];
  keywords: string[]; layout: string; set: string; set_name: string; collector_number: string; rarity: string;
}
interface ExportDeck { name: string; kind: 'deck' | 'token'; cards: string[] }
interface Manifest {
  format: string; version: number; exportedAt: string;
  decks: ExportDeck[]; defs: ExportDef[]; images: Record<string, string>;
  rulings: { oracleId: string; rulings: { source: string; publishedAt: string; comment: string }[] }[];
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exportDir = process.argv[2];
if (!exportDir) throw new Error('usage: node scripts/build-cards.ts path/to/unzipped-v2-export');
const manifest = JSON.parse(readFileSync(join(exportDir, 'manifest.json'), 'utf8')) as Manifest;
if (manifest.format !== 'travel-tabletop-decks' || manifest.version !== 1) {
  throw new Error(`not a v2 deck export (format ${manifest.format}, version ${manifest.version})`);
}

const defs = new Map(manifest.defs.map((d) => [d.id, d]));
const def = (id: string) => {
  const d = defs.get(id);
  if (!d) throw new Error(`the export's decks name a card it doesn't define: ${id}`);
  if (d.back) throw new Error(`${d.name} has a back face; the pool has no double-faced cards`);
  return d;
};

const slug = (name: string) => name.replace(/^Avatar /, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const packets: Packet[] = manifest.decks.filter((d) => d.kind === 'deck').map((d) => {
  const product = d.name.startsWith('Avatar BB:') ? 'Beginner Box' : d.name.startsWith('Avatar JS:') ? 'Jumpstart' : null;
  if (!product) throw new Error(`a deck that is neither Beginner Box nor Jumpstart: ${d.name}`);
  if (d.cards.length !== 20) throw new Error(`${d.name} has ${d.cards.length} cards, not 20`);
  return { id: slug(d.name), name: d.name, product, cards: d.cards.map((c) => def(c).scryfallId) };
});
if (new Set(packets.map((p) => p.id)).size !== packets.length) throw new Error('two packets share a slug');

const tokenDefs = [...new Set(manifest.decks.filter((d) => d.kind === 'token').flatMap((d) => d.cards))].map(def);
const packetDefs = [...new Set(manifest.decks.filter((d) => d.kind === 'deck').flatMap((d) => d.cards))].map(def);

const printing = (d: ExportDef, token: boolean): CardPrinting => {
  const r = d.text.record;
  const image = `${d.sizes.front.large}.${manifest.images[d.sizes.front.large] ?? 'jpg'}`;
  return {
    id: r.id, oracleId: r.oracle_id, name: r.name, manaCost: r.mana_cost ?? '', manaValue: r.cmc,
    typeLine: r.type_line, oracleText: r.oracle_text ?? '',
    ...(r.power !== undefined ? { power: r.power } : {}),
    ...(r.toughness !== undefined ? { toughness: r.toughness } : {}),
    colors: r.colors ?? [], colorIdentity: r.color_identity, keywords: r.keywords, layout: r.layout,
    set: r.set, setName: r.set_name, collectorNumber: r.collector_number, rarity: r.rarity, image, token,
  };
};

const cards: Record<string, CardPrinting> = {};
for (const d of packetDefs) cards[d.scryfallId] = printing(d, false);
for (const d of tokenDefs) cards[d.scryfallId] ??= printing(d, true);
const sortedCards = Object.fromEntries(Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)));

const oracleIds = new Set(Object.values(cards).map((c) => c.oracleId));
const rulings: Record<string, Ruling[]> = {};
for (const r of [...manifest.rulings].sort((a, b) => a.oracleId.localeCompare(b.oracleId))) {
  if (!oracleIds.has(r.oracleId) || r.rulings.length === 0) continue;
  rulings[r.oracleId] = r.rulings.map((x) => ({ date: x.publishedAt, text: x.comment }));
}

const pool: CardPool = {
  exportedAt: manifest.exportedAt,
  packets,
  cards: sortedCards,
  tokens: tokenDefs.map((d) => d.scryfallId).sort(),
  rulings,
};
writeFileSync(join(root, 'src/cards/cards.json'), JSON.stringify(pool, null, 1) + '\n');

// Images: copy each one the pool uses, checking it against the hash it is named by.
const out = join(root, 'public/cards');
mkdirSync(out, { recursive: true });
const wanted = new Set(Object.values(cards).map((c) => c.image));
for (const file of wanted) {
  const from = join(exportDir, 'images', file);
  if (!existsSync(from)) throw new Error(`the export is missing an image: ${file}`);
  const hash = createHash('sha256').update(readFileSync(from)).digest('hex');
  if (!file.startsWith(hash)) throw new Error(`${file} doesn't match its hash (${hash})`);
  const to = join(out, file);
  if (!existsSync(to)) copyFileSync(from, to);
}
for (const file of readdirSync(out)) if (!wanted.has(file)) rmSync(join(out, file));

console.log(`${packets.length} packets, ${Object.keys(cards).length} printings (${tokenDefs.length} tokens), `
  + `${Object.keys(rulings).length} cards with rulings, ${wanted.size} images`);
