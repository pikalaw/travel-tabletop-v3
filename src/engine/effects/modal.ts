import type { Amount } from '../abilities';
import type { Effect } from '.';
import type { Handler } from './kit';

/**
 * "Choose up to X —" on a triggered ability whose number of modes is only known as it resolves
 * (Bumi, King of Three Trials): the controller picks up to `max` different options, which run in
 * printed order. Options with the same `exclusive` key are one mode worded per player ("target
 * player scries 3"), so only one of them may be picked. With `repeat`, "Choose three. You may
 * choose the same mode more than once" (Fiery Confluence): one mode at a time, `repeat` times.
 */
export interface Modal { modal: { options: { text: string; effects: Effect[]; exclusive?: string }[]; max: Amount; repeat?: number } }

export const modal: Handler<Modal> = (e, r) => {
  const repeat = e.modal.repeat;
  if (repeat) {
    const picked = r.answer('option');
    if (!picked) return r.ask({ kind: 'choose', player: r.ctx.controller, text: `Choose a mode (${repeat} left)`, options: e.modal.options.map((o) => o.text) });
    r.then([...e.modal.options[picked.index]!.effects, ...(repeat > 1 ? [{ modal: { ...e.modal, repeat: repeat - 1 } }] : [])]);
    return;
  }
  const max = Math.min(r.n(e.modal.max), e.modal.options.length);
  if (max <= 0) return;
  const picked = r.answer('options');
  if (!picked) return r.ask({ kind: 'choose', player: r.ctx.controller, text: `Choose up to ${max}`, options: e.modal.options.map((o) => o.text), max, exclusive: e.modal.options.map((o) => o.exclusive ?? null) });
  r.then([...picked.indices].sort((a, b) => a - b).flatMap((i) => e.modal.options[i]!.effects));
};
