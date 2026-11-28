/**
 * Costs the payer chooses objects for (601.2h, 602.2b): "sacrifice an artifact or creature",
 * "sacrifice half the lands you control", "discard a card". Casting and activating share them: what
 * may be chosen, whether a choice is legal, and paying it.
 */
import type { Continuous, Cost } from './abilities';
import { view } from './characteristics';
import { amount, holds, matches, select } from './evaluate';
import { controlledBy, event, obj, spellOf, zoneOf } from './state';
import type { GameState, ObjectId, PlayerId } from './types';
import { discardCard, sacrifice } from './zones';

/** What a cost asks the payer to choose: the objects it may take, and how many. */
export interface CostChoices { sacrifice?: { options: ObjectId[]; count: number }; discard?: { options: ObjectId[]; count: number } }

/** Static abilities of the permanents `p` controls that are in force now ("as long as …" holding). */
export function staticsInForce(s: GameState, p: PlayerId): { effect: Continuous; source: ObjectId }[] {
  const v = view(s);
  return controlledBy(s, p).flatMap((o) => {
    if (v(o).abilitiesRemoved) return [];
    return (s.setup.cards[o.card]?.script?.statics ?? [])
      .filter((st) => !st.while || holds(s, v, st.while, { controller: p, source: o.id }))
      .map((st) => ({ effect: st.effect, source: o.id }));
  });
}

/** How much less this spell costs `p` from static abilities ("Lesson spells you cast cost {1} less"). */
export function costReduction(s: GameState, p: PlayerId, spell: ObjectId): number {
  const o = obj(s, spell);
  const zone = o.zone.includes('.') ? o.zone.split('.')[1] as 'hand' : 'stack';
  return staticsInForce(s, p).reduce((n, { effect, source }) => {
    const r = effect.reducesCost;
    const ctx = { controller: p, source };
    if (!r || !matches(s, view(s), o, { ...r.spells, zone }, ctx)) return n;
    if (r.firstEachTurn && s.activatedThisTurn[`first:${source}`]) return n;
    return n + amount(s, view(s), r.by, ctx);
  }, 0);
}

/** A spell was cast: "the first … spell you cast each turn" reductions it matched are used up. */
export function usedFirstReductions(s: GameState, p: PlayerId, spell: ObjectId): void {
  const o = obj(s, spell);
  for (const { effect, source } of staticsInForce(s, p)) {
    const r = effect.reducesCost;
    if (r?.firstEachTurn && matches(s, view(s), o, { ...r.spells, zone: 'stack' }, { controller: p, source })) s.activatedThisTurn[`first:${source}`] = 1;
  }
}

/** The top card of `p`'s library, if a static ability lets them look at it any time (Hakoda); else null. */
export function libraryTopSeen(s: GameState, p: PlayerId): ObjectId | null {
  const lib = s.zones[zoneOf(p, 'library')];
  return lib.length && staticsInForce(s, p).some(({ effect }) => effect.revealsLibraryTop) ? lib[lib.length - 1]! : null;
}

/** The top card of `p`'s library, if a static ability lets them cast it (Hakoda: "Ally spells"). */
export function castableFromLibraryTop(s: GameState, p: PlayerId, id: ObjectId): boolean {
  const lib = s.zones[zoneOf(p, 'library')];
  if (lib[lib.length - 1] !== id) return false;
  return staticsInForce(s, p).some(({ effect, source }) => !!effect.castFromLibraryTop && matches(s, view(s), obj(s, id), { ...effect.castFromLibraryTop, zone: 'library' }, { controller: p, source }));
}

/** "You may cast the first creature spell you cast each turn as though it had flash" (The Blue Spirit). */
export const firstCreatureFlash = (s: GameState, p: PlayerId) =>
  s.turnLog.creatureSpells[p] === 0 && staticsInForce(s, p).some(({ effect }) => effect.firstCreatureFlash);

/** A spell's extra cost: the additional-cost option chosen, or its fixed additional cost. */
export function castCost(s: GameState, id: ObjectId, option?: number): Cost | undefined {
  const spell = spellOf(s, id);
  return option !== undefined ? spell?.costOptions?.[option]?.cost : spell?.additionalCost;
}

export function costChoices(s: GameState, p: PlayerId, cost: Cost | undefined, source: ObjectId): CostChoices {
  const out: CostChoices = {};
  const ctx = { controller: p, source };
  if (cost?.sacrifice) {
    const options = select(s, view(s), { ...cost.sacrifice, controller: 'you' }, ctx).map((o) => o.id).filter((id) => id !== source);
    out.sacrifice = { options, count: cost.sacrificeCount === undefined ? 1 : amount(s, view(s), cost.sacrificeCount, ctx) };
  }
  if (cost?.discard) out.discard = { options: s.zones[zoneOf(p, 'hand')].filter((id) => id !== source), count: cost.discard };
  return out;
}

/** Chosen objects when there's nothing to choose (exactly as many as needed), else what was chosen. */
const settled = (c: { options: ObjectId[]; count: number } | undefined, chosen?: ObjectId[]) =>
  (chosen ?? (c && c.options.length === c.count ? c.options : undefined));

/** Why these choices can't pay the cost, or null. Without choices, whether it could be paid at all. */
export function costChoiceProblem(c: CostChoices, sacrificing?: ObjectId[], discarding?: ObjectId[]): string | null {
  const check = (what: { options: ObjectId[]; count: number } | undefined, chosen: ObjectId[] | undefined, verb: string) => {
    if (!what) return null;
    if (what.options.length < what.count) return verb === 'sacrifice' ? 'Not enough to sacrifice' : 'Not enough cards to discard';
    if (chosen && (chosen.length !== what.count || new Set(chosen).size !== chosen.length || chosen.some((id) => !what.options.includes(id)))) {
      return `Choose ${what.count} to ${verb}`;
    }
    return null;
  };
  return check(c.sacrifice, sacrificing, 'sacrifice') ?? check(c.discard, discarding, 'discard');
}

/** The choices still to make before paying: which kind, or null when everything is chosen or forced. */
export function costChoiceMissing(c: CostChoices, sacrificing?: ObjectId[], discarding?: ObjectId[]): 'sacrifice' | 'discard' | null {
  if (c.sacrifice && c.sacrifice.count > 0 && !settled(c.sacrifice, sacrificing)) return 'sacrifice';
  if (c.discard && c.discard.count > 0 && !settled(c.discard, discarding)) return 'discard';
  return null;
}

/** Pays the chosen parts of a cost: sacrifices, then discards. */
export function payCostChoices(s: GameState, p: PlayerId, c: CostChoices, sacrificing?: ObjectId[], discarding?: ObjectId[]): void {
  const name = s.setup.players[p].name;
  for (const id of settled(c.sacrifice, sacrificing) ?? []) {
    event(s, `${name} sacrifices ${view(s)(obj(s, id)).name}`);
    sacrifice(s, [id], p);
  }
  for (const id of settled(c.discard, discarding) ?? []) discardCard(s, p, id);
}
