import type { ObjectRef } from '../abilities';
import { leaveBattlefield } from '../zones';
import type { Handler } from './kit';

/** "Exile it. Return it to the battlefield under its owner's control at the beginning of the next end step", or (`now`) at once. */
export interface ExileReturns { exileReturns: ObjectRef; now?: boolean }

export const exileReturns: Handler<ExileReturns> = (e, r) => {
  const targets = r.objs(e.exileReturns).filter((o) => o.zone === 'battlefield');
  if (!targets.length) return;
  for (const o of targets) r.log(`${r.cardName(o.id)} is exiled until the next end step`);
  const ids = leaveBattlefield(r.s, targets.map((o) => o.id), 'exile');
  if (!ids.length) return; // tokens cease to exist
  if (e.now) { r.then([{ returnToBattlefield: { ids }, toOwner: true }]); return; }
  const src = r.s.objects[r.ctx.source];
  r.s.delayed.push({
    ability: { when: { step: 'end', whose: 'any' }, effects: [{ returnToBattlefield: { ids }, toOwner: true }], text: 'At the beginning of the next end step, return the exiled cards to the battlefield under their owner\'s control.' },
    controller: r.ctx.controller, source: r.ctx.source, sourceName: src ? r.v(src).name : 'An ability', card: src?.card ?? r.s.objects[ids[0]!]!.card,
  });
};
