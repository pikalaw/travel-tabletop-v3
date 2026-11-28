import { TOKENS } from '../tokens';
import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// The Cave of Two Lovers: (As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.) / I — Create two 1/1 white Ally creature tokens. / II — Search your library for a Mountain or Cave card, reveal it, put it into your hand, then shuffle. / III — Earthbend 3. (Target land you control becomes a 0/0 creature with haste that's still a land. Put three +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'c2df54f1-a2db-4de3-bc96-5c07f4594752',
  name: "The Cave of Two Lovers",
  triggered: [
    { when: { lore: true }, chapter: 1, effects: [{ createToken: TOKENS.ally, n: 2 }], text: 'I — Create two 1/1 white Ally creature tokens.' },
    { when: { lore: true }, chapter: 2, effects: [{ search: { subtypes: ['Mountain', 'Cave'] }, to: 'hand' }], text: 'II — Search your library for a Mountain or Cave card, reveal it, put it into your hand, then shuffle.' },
    { when: { lore: true }, chapter: 3, targets: [LAND_YOU_CONTROL], effects: [earthbend(3, 0)], text: 'III — Earthbend 3.' },
  ],
});
