import type { ObjectRef } from '../abilities';
import { onStack } from '../stack';
import { legalTargets } from '../targets';
import type { Target } from '../types';
import { isPlayer, type Handler, type Resolution } from './kit';

const describe = (r: Resolution, t: Target) => (isPlayer(t) ? r.playerName(t) : r.cardName(t));

/**
 * "Change the target of target spell or ability with a single target" (115.7a): its controller
 * (this effect's) picks a new legal target for it, if there is one other than the current target.
 */
export interface ChangeTarget { changeTarget: ObjectRef }

export const changeTarget: Handler<ChangeTarget> = (e, r) => {
  const o = r.objs(e.changeTarget).find((x) => x.zone === 'stack');
  if (!o) return;
  const { specs, ctx } = onStack(r.s, o.id);
  const at = (o.targets ?? []).findIndex((ts) => ts.length === 1);
  const spec = specs[at];
  if (at < 0 || !spec) return;
  const current = o.targets![at]![0]!;
  const options: Target[] = legalTargets(r.s, spec, ctx).filter((t) => t !== current && t !== r.s.resolving!.object);
  if (!options.length) return;
  const picked = r.answer('option');
  if (!picked) return r.ask({ kind: 'choose', player: r.ctx.controller, text: `Choose a new target for ${r.cardName(o.id)}`, options: options.map((t) => describe(r, t)) });
  const to = options[picked.index]!;
  o.targets![at] = [to];
  r.log(`${r.playerName(r.ctx.controller)} changes the target of ${r.cardName(o.id)} to ${describe(r, to)}`);
};
