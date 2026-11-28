import type { ObjectRef } from '../abilities';
import { leaveBattlefield } from '../zones';
import type { Handler } from './kit';

/** "Its owner puts it into their library second from the top or on the bottom": the owner chooses. */
export interface ToOwnersLibrary { toOwnersLibrary: ObjectRef; places: ('secondFromTop' | 'bottom')[] }

const WORDS = { secondFromTop: 'Second from the top', bottom: 'On the bottom' } as const;

export const toOwnersLibrary: Handler<ToOwnersLibrary> = (e, r) => {
  const { s } = r;
  const [o] = r.objs(e.toOwnersLibrary);
  if (!o || o.zone !== 'battlefield') return;
  const owner = o.owner;
  let place = e.places[0]!;
  if (e.places.length > 1) {
    const picked = r.answer('option');
    if (!picked) return r.ask({ kind: 'choose', player: owner, text: `Put ${r.cardName(o.id)} into your library`, options: e.places.map((p) => WORDS[p]) });
    place = e.places[picked.index]!;
  }
  const name = r.cardName(o.id);
  const [id] = leaveBattlefield(s, [o.id], 'library'); // onto the top
  if (!id) return; // a token ceases to exist
  const lib = s.zones[`${owner}.library`];
  lib.splice(lib.indexOf(id), 1);
  if (place === 'bottom') lib.unshift(id); else lib.splice(Math.max(0, lib.length - 1), 0, id);
  r.log(`${r.playerName(owner)} puts ${name} into their library ${place === 'bottom' ? 'on the bottom' : 'second from the top'}`);
};
