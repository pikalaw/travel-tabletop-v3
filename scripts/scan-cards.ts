/**
 * The M0 card scan (technical design, "Milestones"): reads src/cards/cards.json, tags every
 * ability line with the engine features it needs, and writes docs/card-scan.md with
 * - how many cards need each feature, grouped as the effect vocabulary will be;
 * - the hard cards, with what each needs beyond the vocabulary and a size;
 * - ability lines no feature pattern matched, so nothing in the pool goes unseen;
 * - every card with its features.
 *
 *   node scripts/scan-cards.ts
 *
 * The patterns are a first sort over Oracle text, read by a person, not a parser: each card's
 * script and test (M4) are the real check. The hard-card notes are written by hand from reading
 * every line of the pool.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CardPool, CardPrinting } from '../src/cards/types';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pool = JSON.parse(readFileSync(join(root, 'src/cards/cards.json'), 'utf8')) as CardPool;

type Group = 'Keywords' | 'Set mechanics' | 'Triggers' | 'Effects' | 'Costs and casting' | 'Conditions and memory' | 'Static and continuous';
interface Feature { id: string; group: Group; label: string; re: RegExp }

const f = (group: Group, id: string, label: string, re: RegExp): Feature => ({ id, group, label, re });
const FEATURES: Feature[] = [
  // Keywords: implemented once in the keyword library.
  ...['flying', 'vigilance', 'reach', 'menace', 'defender', 'first strike', 'double strike', 'trample', 'deathtouch',
    'lifelink', 'haste', 'flash', 'hexproof', 'indestructible', 'prowess', 'mentor'].map((k) =>
    f('Keywords', k, k, new RegExp(`\\b${k}\\b`, 'i'))),
  f('Keywords', 'ward', 'ward {N}', /\bward \{/i),
  f('Keywords', 'kicker', 'kicker', /\bkicker\b|was kicked/i),
  f('Keywords', 'flashback', 'flashback', /\bflashback\b/i),
  f('Keywords', 'storm', 'storm', /^storm$/im),
  f('Keywords', 'affinity', 'affinity for Allies', /affinity for/i),
  f('Keywords', 'landcycling', 'landcycling (typecycling)', /\w+cycling \{/i),
  f('Keywords', 'crew', 'crew N', /\bcrew \d/i),
  f('Keywords', 'equip', 'equip, Equipment', /\bequip \{|equipped creature|attach/i),
  f('Keywords', 'enchant', 'Auras (enchant)', /^enchant /im),
  f('Keywords', 'raid', 'raid', /\braid\b/i),
  f('Keywords', 'landfall', 'landfall', /\blandfall\b/i),
  f('Keywords', 'exhaust', 'exhaust', /\bexhaust\b/i),
  // The set's mechanics.
  f('Set mechanics', 'earthbend', 'earthbend N', /earthbend/i),
  f('Set mechanics', 'firebending', 'firebending N', /firebending/i),
  f('Set mechanics', 'waterbend', 'waterbend {N}', /waterbend/i),
  f('Set mechanics', 'airbend', 'airbend', /airbend/i),
  f('Set mechanics', 'lesson', 'Lessons (counted or named)', /\blesson\b/i),
  f('Set mechanics', 'ally', 'Allies (counted or named)', /\ball(y|ies)\b/i),
  f('Set mechanics', 'shrine', 'Shrines (counted)', /\bshrines?\b/i),
  f('Set mechanics', 'experience', 'experience counters (a player counter)', /experience counter/i),
  f('Set mechanics', 'saga', 'Saga chapters', /^(I|II|III|IV)(, (II|III))* —/m),
  // Triggers.
  f('Triggers', 'etb', 'enters the battlefield', /\bwhen(ever)? [^.]*\benters?\b/i),
  f('Triggers', 'dies', 'dies, leaves the battlefield, is put into a graveyard', /\bdies\b|leaves? the battlefield|put into a graveyard from the battlefield/i),
  f('Triggers', 'attacks', 'attacks, you attack', /\battacks?\b(?! alone unless)|\byou attack\b/i),
  f('Triggers', 'tapped', 'becomes tapped or untapped', /become(s)? (un)?tapped/i),
  f('Triggers', 'cast', 'a spell is cast', /whenever (you|an opponent) casts? |you cast a spell/i),
  f('Triggers', 'phase', 'beginning of upkeep, combat or end step', /at the beginning of (your |the next |combat)/i),
  f('Triggers', 'second-draw', 'your second card drawn each turn', /draw your second card/i),
  f('Triggers', 'sacrifice-trigger', 'whenever you sacrifice', /whenever you sacrifice/i),
  f('Triggers', 'combat-damage', 'deals combat damage to a player', /deals? combat damage to (a player|an opponent|you)/i),
  f('Triggers', 'counter-put', 'counters are put', /whenever you put one or more/i),
  f('Triggers', 'library-put', 'cards are put into a library', /put into a library/i),
  f('Triggers', 'discard-mill-trigger', 'an opponent discards or mills', /whenever an opponent discards/i),
  f('Triggers', 'targeted', 'becomes the target', /becomes the target/i),
  f('Triggers', 'reflexive', 'reflexive ("When you do")', /when you do/i),
  f('Triggers', 'delayed', 'delayed ("at the beginning of the next end step", "this turn")', /at the beginning of the next end step|when that creature dies this turn|whenever a creature [^.]* dies this turn|until your next turn, whenever|when you next cast/i),
  f('Triggers', 'intervening-if', 'intervening "if" clause', /^(when|whenever|at)\b[^,]*, if /im),
  f('Triggers', 'once-each-turn', 'triggers only once each turn', /only once each turn|do this only once each turn|second time this ability has resolved/i),
  // Effects.
  f('Effects', 'draw', 'draw', /\bdraws? (a|two|three|cards?|that many|x)\b|draw a card for each|draws? cards? equal/i),
  f('Effects', 'discard', 'discard', /\bdiscards?\b/i),
  f('Effects', 'damage', 'deal damage', /\bdeals? (\d|x|damage)/i),
  f('Effects', 'life', 'gain or lose life', /\b(gain|lose|loses)\b [^.]*\blife\b|pay \d life/i),
  f('Effects', 'token', 'create a token', /\bcreates? /i),
  f('Effects', 'counters', '+1/+1 counters', /\+1\/\+1 counter/i),
  f('Effects', 'other-counters', 'stun, quest, lore, fire and double strike counters', /\b(stun|quest|lore|fire|double strike) counter/i),
  f('Effects', 'pump', 'gets +X/+Y (until end of turn or while)', /gets? [+-]\w+\/[+-]\w+/i),
  f('Effects', 'grant', 'gains or has an ability', /\b(gains?|has|have)\b [^.]*(flying|trample|vigilance|haste|menace|lifelink|first strike|double strike|hexproof|indestructible|reach|"|firebending)/i),
  f('Effects', 'destroy', 'destroy', /\bdestroy\b/i),
  f('Effects', 'exile', 'exile', /\bexile/i),
  f('Effects', 'bounce', 'return to hand', /return [^.]* to (its|their) owners?'? hands?|into your hand|to your hand/i),
  f('Effects', 'tap-untap', 'tap or untap', /\b(tap|untap)\b (target|up to|it|all|one or two|that|enchanted)/i),
  f('Effects', 'search', 'search the library', /search your library|search their library/i),
  f('Effects', 'look-top', 'look at or reveal the top cards', /look at the top|reveal the top|reveal cards from the top|top card of your library/i),
  f('Effects', 'mill', 'mill', /\bmills?\b/i),
  f('Effects', 'surveil-scry', 'surveil, scry', /\b(surveil|scry|scries)\b/i),
  f('Effects', 'sacrifice', 'sacrifice', /\bsacrifices?\b/i),
  f('Effects', 'fight', 'fight, or deal damage equal to power', /\bfights?\b|deals? damage equal to (its|their) power/i),
  f('Effects', 'reanimate', 'return from the graveyard to the battlefield', /from (your|that player's|a) graveyard (to|onto) the battlefield|return (this|that) card to the battlefield|return it to the battlefield|return those cards to the battlefield/i),
  f('Effects', 'onto-battlefield', 'put a card onto the battlefield', /onto the battlefield/i),
  f('Effects', 'counterspell', 'counter a spell', /counter target/i),
  f('Effects', 'retarget', 'change the target of a spell or ability', /change the target/i),
  f('Effects', 'remove-counters', 'remove counters', /remove (up to \w+ |all |a )?counters?/i),
  f('Effects', 'mana', 'add mana', /\badd (\{|one mana|three mana|six|an amount)/i),
  f('Effects', 'mode', 'modes (choose one, one or both, three, up to X)', /choose (one|two|three|up to)|choose one or both/i),
  f('Effects', 'divide', 'divide or distribute', /distribute|divided/i),
  f('Effects', 'excess', 'excess damage', /excess damage/i),
  f('Effects', 'library-place', 'put a card into a library at a position', /second from the top|on the bottom of (its owner's|your) library|on top of your library|shuffles it into/i),
  f('Effects', 'each-player', 'each player does something', /\beach player\b/i),
  // Costs and casting.
  f('Costs and casting', 'x', 'X in a cost or effect', /\{X\}|\bX\b/),
  f('Costs and casting', 'additional-cost', 'additional cost to cast', /additional cost to cast/i),
  f('Costs and casting', 'cost-change', 'cost reductions and increases', /costs? \{\d\} less|cost \{\d\} less|less to cast/i),
  f('Costs and casting', 'activated', 'activated abilities', /^[^"\n]*(\{T\}|\{\d+\}|\{[WUBRGC]\}|sacrifice [^:]*|pay \d life|discard this card|tap (two )?untapped [^:]*|waterbend \{\w+\}|remove a counter[^:]*)[^:\n"]*:/im),
  f('Costs and casting', 'activation-limit', 'activation limits (once each turn, only during your turn, as a sorcery)', /activate only/i),
  f('Costs and casting', 'flash-permission', 'cast as though it had flash', /as though it had flash/i),
  f('Costs and casting', 'free-cast', 'cast or play without paying, or from another zone', /without paying|may play (that card|one of those)|may cast (ally spells|the exiled card)|cast it|from the top of your library/i),
  // Conditions and the game's memory.
  f('Conditions and memory', 'this-turn', '"this turn" facts (drawn, attacked, sacrificed, left, damaged)', /this turn\b(?! (only|and))|during combat|during (your|an opponent's|each of your) turns?/i),
  f('Conditions and memory', 'graveyard-count', 'counting cards in a graveyard', /cards? in your graveyard|in a graveyard|card in your graveyard|graveyard has/i),
  f('Conditions and memory', 'count', '"for each" and "equal to the number of" counts', /for each|equal to the number|the number of/i),
  // Static and continuous effects.
  f('Static and continuous', 'anthem', 'other creatures you control get or have', /(creatures|allies|warriors|each [\w-]+ creature) you control (get|have)|other creatures you control/i),
  f('Static and continuous', 'cda', 'power set by a count (characteristic-defining)', /'s power is equal to/i),
  f('Static and continuous', 'set-pt', 'base power and toughness set', /base power/i),
  f('Static and continuous', 'type-change', 'becomes a type, or loses abilities', /becomes? (a|an) [^.]*(creature|land|avatar)|in addition to its other types|loses all abilities|is a citizen|she's a land|he's a spirit/i),
  f('Static and continuous', 'evasion', 'blocking restrictions (can\'t block, can\'t be blocked, alone)', /can't (be )?block|can't attack|attack alone|attacks alone|blocked by more than one/i),
  f('Static and continuous', 'no-untap', 'doesn\'t untap, or untaps in another step', /doesn't untap|untap this artifact during/i),
  f('Static and continuous', 'replacement', 'replacement effects ("instead", "enters with", "enters tapped")', /\binstead\b|enters with|enters tapped|would be put into a graveyard/i),
  f('Static and continuous', 'granted-ability', 'grants a quoted ability', /have "|has "|gains "/i),
  f('Static and continuous', 'ability-gain', 'gains another object\'s abilities', /has all activated and triggered abilities/i),
  f('Static and continuous', 'copy', 'copies of permanents, spells or abilities', /\bcop(y|ies)\b/i),
];

/** Cards the vocabulary can't simply describe, from reading the whole pool. Size: S a day or less, M a few days, L a week or more. */
interface Hard { why: string; needs: string; size: 'S' | 'M' | 'L' }
const HARD: Record<string, Hard> = {
  'Koh, the Face Stealer': { why: 'Has every activated and triggered ability of the last chosen exiled card', needs: 'Layer 6 ability copying from an object in exile, re-pointed when a new card is chosen; "exiled with" links', size: 'L' },
  'Honest Work': { why: 'Loses all abilities, becomes a Citizen named Humble Merchant with base 1/1 and a mana ability', needs: 'Layers 3 (name), 4, 6 and 7b at once, and 613.8 dependencies: removing an ability that grants others (Aang, Air Nomad; Smellerbee; Great Divide Guide) applies first', size: 'L' },
  'Firebender Ascension': { why: 'Copies a triggered ability of an attacking creature', needs: 'Copying an ability on the stack, with new targets', size: 'M' },
  "Jeong Jeong, the Deserter": { why: 'Copies the next Lesson spell you cast this turn', needs: 'Copying a spell on the stack; a delayed trigger on "next cast"', size: 'M' },
  'Storm of Memories': { why: 'Storm copies; casts a random graveyard card for free and exiles it after', needs: 'Spell copies; cast-from-graveyard without paying; a replacement for where the spell goes', size: 'M' },
  'Joo Dee, One of Many': { why: 'Creates a token copy of itself', needs: 'Token copies (layer 1 copiable values)', size: 'S' },
  'Ran and Shaw': { why: 'A token copy of itself that isn\'t legendary, if it was cast', needs: 'Token copies with an exception; "if you cast them"', size: 'S' },
  'Bolt Bend': { why: 'Changes the target of a spell or ability', needs: 'Re-targeting a stack object, checking the new target is legal', size: 'M' },
  'Hakoda, Selfless Commander': { why: 'Look at the top of your library any time; cast Allies from it', needs: 'A per-player private view of the library top; casting from the library', size: 'M' },
  'Hama, the Bloodbender': { why: 'Casts an opponent\'s exiled card by waterbending X instead of its cost', needs: 'Cast-from-exile with an alternative cost; owner ≠ controller of the spell; "for as long as you control"', size: 'M' },
  'Fire Lord Ozai': { why: 'Plays the opponent\'s exiled top card for free; mana that lasts until end of combat', needs: 'Play-from-exile for one card of several; owner ≠ controller; combat-long mana', size: 'M' },
  'Descendants\' Path': { why: 'Casts the revealed top card for free if it shares a creature type', needs: 'Cast during resolution without paying; creature-type comparison', size: 'S' },
  'Yue, the Moon Spirit': { why: 'Casts a noncreature spell from hand for free as an ability', needs: 'Casting during resolution', size: 'S' },
  'Zuko, Exiled Prince': { why: 'Plays the exiled top card this turn', needs: 'Play-from-exile permission with a duration', size: 'S' },
  'Lost in Memories': { why: 'Grants a trigger that grants flashback with a cost equal to the mana cost', needs: 'Granted keyword with a computed cost', size: 'S' },
  'Princess Yue': { why: 'Returns as a land named Moon with a mana ability, if she was a nonland creature', needs: 'Return with type, name and ability changes; last-known information for "if she was"', size: 'M' },
  "Fang, Roku's Companion": { why: 'Returns as a Spirit if he wasn\'t one', needs: 'Return with a type added; last-known information', size: 'S' },
  'Combustion Man': { why: 'Destroy unless the controller lets it deal damage to them', needs: '"Unless" choice belonging to the other player (a hand-off)', size: 'S' },
  'Dai Li Indoctrination': { why: 'Reveals the opponent\'s hand; you choose from it', needs: 'A reveal to one player only on a shared device', size: 'S' },
  'Destined Confrontation': { why: 'Each player picks creatures with total power 4 or less to keep', needs: 'A choice per player under a sum constraint, in APNAP order, with hand-offs', size: 'S' },
  'Animal Attendant': { why: 'Mana that adds a +1/+1 counter if spent on a non-Human creature spell', needs: 'Mana tagged with a rider, tracked from pool to spell', size: 'M' },
  'White Lotus Hideout': { why: 'Mana spendable only on Lesson or Shrine spells', needs: 'Restricted mana in the payment solver', size: 'S' },
  'Monk Gyatso': { why: 'Triggers when a creature becomes the target of a spell or ability', needs: 'A "becomes the target" event', size: 'S' },
  'Reckless Blaze': { why: 'Adds {R} whenever a creature dealt damage by it dies this turn', needs: 'A delayed trigger that remembers which objects it damaged', size: 'S' },
  'Dutiful Knowledge Seeker': { why: 'Triggers when cards are put into a library from anywhere', needs: 'A zone-change event into libraries, batched ("one or more")', size: 'S' },
  'Wan Shi Tong, All-Knowing': { why: 'The owner chooses second from the top or the bottom; library-put trigger', needs: 'A choice by the other player; library positions; batched library trigger', size: 'S' },
  'Diligent Zookeeper': { why: '+1/+1 for each creature type, to 10', needs: 'Counting a creature\'s types after layer 4', size: 'S' },
  'Crashing Wave': { why: 'Waterbend X; tap up to X, then distribute three stun counters among tapped creatures', needs: 'X additional cost; distributing counters', size: 'S' },
  'Fiery Confluence': { why: 'Choose three modes, repeats allowed', needs: 'Modes with repetition', size: 'S' },
  'Solid Ground': { why: 'One more +1/+1 counter whenever counters would be put', needs: 'A replacement on counter placement (with Earth Kingdom General\'s "that much")', size: 'S' },
  'Bender\'s Waterskin': { why: 'Untaps during each other player\'s untap step', needs: 'A turn-based action for a non-active player\'s permanent', size: 'S' },
  'Flopsie, Bumi\'s Buddy': { why: 'Can\'t be blocked by more than one creature', needs: 'A block restriction over the whole declaration', size: 'S' },
  'Fire Nation Salvagers': { why: 'Puts a creature from the opponent\'s graveyard onto the battlefield under your control', needs: 'Owner ≠ controller on the battlefield (no control-change effect, but the model must keep them apart)', size: 'S' },
  'Jet, Rebel Leader': { why: 'Puts a creature onto the battlefield tapped and attacking', needs: 'Entering attacking without being declared', size: 'S' },
  'Fire Navy Trebuchet': { why: 'A named token, tapped and attacking, sacrificed at the next end step', needs: 'As above, plus a delayed trigger', size: 'S' },
  'Nightmares and Daydreams': { why: 'Until your next turn, whenever you cast an instant or sorcery, mill', needs: 'A trigger with a duration that spans the opponent\'s turn', size: 'S' },
  'Tale of Katara and Toph': { why: 'Grants "first time each of your turns" triggers', needs: 'Granted triggers with per-object once-per-turn memory', size: 'S' },
  'Moku, Meandering Drummer': { why: '"You may pay {1}" during resolution', needs: 'Paying mana while a trigger resolves', size: 'S' },
};

const strip = (c: CardPrinting) => c.oracleText.replace(/\([^)]*\)/g, '').split(c.name).join('~')
  .replace(new RegExp(`\\b${c.name.split(',')[0]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), '~');

const cards = Object.values(pool.cards).filter((c) => !c.typeLine.startsWith('Basic'));
const byName = new Map<string, CardPrinting>();
for (const c of cards) byName.set(c.name, c);
const names = [...byName.keys()].sort();

const tags = new Map<string, Set<string>>();
const unmatched: [string, string][] = [];
for (const name of names) {
  const c = byName.get(name)!;
  const set = new Set<string>();
  for (const line of strip(c).split('\n').map((l) => l.trim()).filter(Boolean)) {
    const hits = FEATURES.filter((x) => x.re.test(line));
    for (const h of hits) set.add(h.id);
    if (hits.length === 0) unmatched.push([name, line]);
  }
  tags.set(name, set);
}
for (const name of Object.keys(HARD)) if (!byName.has(name)) throw new Error(`hard card not in the pool: ${name}`);

const count = (id: string) => names.filter((n) => tags.get(n)!.has(id)).length;
const groups = [...new Set(FEATURES.map((x) => x.group))];
const md: string[] = [];
md.push('# Card scan (M0)', '');
md.push(`Generated by \`scripts/scan-cards.ts\` from \`src/cards/cards.json\` (export of ${pool.exportedAt.slice(0, 10)}). `
  + `${names.length} different non-basic cards and tokens, by name. Feature counts come from patterns over Oracle text with reminder text removed: `
  + 'a first sort for building the effect vocabulary, not a parser. The hard cards were written by hand after reading every line.', '');
md.push('## Features, by how many cards need them', '');
for (const g of groups) {
  md.push(`### ${g}`, '', '| Feature | Cards | Examples |', '| --- | --- | --- |');
  for (const x of FEATURES.filter((y) => y.group === g).sort((a, b) => count(b.id) - count(a.id))) {
    const ex = names.filter((n) => tags.get(n)!.has(x.id)).slice(0, 3).join(', ');
    md.push(`| ${x.label} | ${count(x.id)} | ${ex} |`);
  }
  md.push('');
}
md.push('## Hard cards', '');
md.push('Cards whose rules go beyond the effect vocabulary. Size: **S** a day or less, **M** a few days, **L** a week or more.', '');
md.push('| Card | Why | Needs | Size |', '| --- | --- | --- | --- |');
const order = { L: 0, M: 1, S: 2 };
for (const [n, h] of Object.entries(HARD).sort((a, b) => order[a[1].size] - order[b[1].size] || a[0].localeCompare(b[0]))) {
  md.push(`| ${n} | ${h.why} | ${h.needs} | ${h.size} |`);
}
const sizes = Object.values(HARD).reduce((m, h) => ({ ...m, [h.size]: (m[h.size] ?? 0) + 1 }), {} as Record<string, number>);
md.push('', `${Object.keys(HARD).length} hard cards: ${sizes.L ?? 0} L, ${sizes.M ?? 0} M, ${sizes.S ?? 0} S.`, '');
md.push('## Lines no pattern matched', '');
md.push(unmatched.length ? unmatched.map(([n, l]) => `- ${n}: ${l}`).join('\n') : 'None.', '');
md.push('## Every card', '', '| Card | Features |', '| --- | --- |');
for (const n of names) md.push(`| ${n}${HARD[n] ? ' (hard)' : ''} | ${[...tags.get(n)!].join(', ')} |`);
writeFileSync(join(root, 'docs/card-scan.md'), md.join('\n') + '\n');
console.log(`${names.length} cards, ${unmatched.length} unmatched lines, ${Object.keys(HARD).length} hard cards`);
