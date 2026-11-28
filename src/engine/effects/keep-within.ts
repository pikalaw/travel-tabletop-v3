import type { Filter } from '../abilities';
import { select } from '../evaluate';
import { other } from '../types';
import { sacrifice } from '../zones';
import type { Handler } from './kit';

/**
 * "Each player chooses any number of creatures they control with total power 4 or less, then
 * sacrifices all other creatures they control" (Destined Confrontation). The active player
 * chooses first (APNAP); the sacrifices happen together.
 */
export interface KeepWithinPower { keepWithinPower: number; of: Filter }

export const keepWithinPower: Handler<KeepWithinPower> = (e, r) => {
  const { s, v } = r;
  const res = s.resolving!;
  const kept = (res.kept ??= {});
  const order = [s.active, other(s.active)];
  const answer = r.answer('pick');
  if (answer) kept[order.find((p) => !kept[p])!] = answer.cards;
  const mine = (p: string) => select(s, v, { ...e.of, controller: 'you' }, { ...r.ctx, controller: p as 'p1' }).map((o) => o.id);
  for (const p of order) {
    if (kept[p]) continue;
    const options = mine(p);
    if (!options.length) { kept[p] = []; continue; }
    return r.ask({ kind: 'pick', player: p, from: options, options, min: 0, max: options.length, maxPower: e.keepWithinPower, text: `Choose creatures to keep, with total power ${e.keepWithinPower} or less; the rest are sacrificed`, done: 'Keep these', none: 'Keep none' });
  }
  delete res.kept;
  for (const p of order) {
    const lose = mine(p).filter((id) => !kept[p]!.includes(id));
    for (const id of lose) r.log(`${r.playerName(p)} sacrifices ${r.cardName(id)}`);
    sacrifice(s, lose, p);
  }
};
