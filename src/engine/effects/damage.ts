import type { Amount, ObjectRef, PlayerRef } from '../abilities';
import { characteristics } from '../characteristics';
import { event } from '../state';
import type { GameState, Target } from '../types';
import { isPlayer, type Handler } from './kit';

/** "Deals N damage to …". The excess damage (120.4a) is kept for the amount 'excessDamage'. */
export interface Damage { damage: Amount; to: ObjectRef | PlayerRef; from?: ObjectRef }

/** Deals damage from a source (120.3): to a player, life loss; to a creature, marked damage. Combat uses it too. */
export function dealDamage(s: GameState, sourceId: string, to: Target, n: number): void {
  if (n <= 0) return;
  const src = s.objects[sourceId];
  const kws = src ? characteristics(s, src).keywords : [];
  const srcName = src ? characteristics(s, src).name : 'A source';
  if (isPlayer(to)) {
    s.players[to].life -= n;
    s.turnLog.lifeLost[to] += n;
    event(s, `${srcName} deals ${n} damage to ${s.setup.players[to].name}`);
  } else {
    const o = s.objects[to];
    if (!o || o.zone !== 'battlefield') return;
    o.damage += n;
    if (kws.includes('deathtouch')) o.deathtouched = true;
    event(s, `${srcName} deals ${n} damage to ${characteristics(s, o).name}`);
  }
  if (src && kws.includes('lifelink')) s.players[src.controller].life += n;
}

export const damage: Handler<Damage> = (e, r) => {
  const { s, v, ctx } = r;
  const from = e.from ? r.objs(e.from)[0]?.id ?? ctx.source : ctx.source;
  for (const t of r.recipients(e.to)) {
    const k = r.n(e.damage);
    // 120.4a: excess damage is damage beyond what's lethal (one, from a deathtouch source).
    const o = !isPlayer(t) ? s.objects[t] : undefined;
    const deathtouch = !!s.objects[from] && v(s.objects[from]!).keywords.includes('deathtouch');
    const lethal = o ? (deathtouch ? (v(o).toughness - o.damage > 0 ? 1 : 0) : Math.max(0, v(o).toughness - o.damage)) : 0;
    dealDamage(s, from, t, k);
    s.resolving!.excess = o ? Math.max(0, k - lethal) : 0;
  }
};
