/**
 * Every card script, by Oracle id (technical design, "Scripts"). The build gathers the files in
 * scripts/, so adding a card is adding a file.
 */
import type { CardScript } from '../engine/abilities';

const modules = import.meta.glob<{ default: CardScript }>('./scripts/*.ts', { eager: true });

export const scripts: ReadonlyMap<string, CardScript> = new Map(
  Object.entries(modules).map(([path, m]) => {
    if (!m.default?.oracleId) throw new Error(`${path} doesn't export a card script`);
    return [m.default.oracleId, m.default];
  }),
);
