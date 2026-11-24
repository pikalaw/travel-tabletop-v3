import { landcycling } from '../keywords';
import { card } from '../script';

// Mongoose Lizard: Menace (This creature can't be blocked except by two or more creatures.) / When this creature enters, it deals 1 damage to any target. / Mountaincycling {2} ({2}, Discard this card: Search your library for a Mountain card, reveal it, put it into your hand, then shuffle.)
export default card({
  oracleId: 'a9bae56c-9666-42e8-94ec-03b0a964b142',
  name: "Mongoose Lizard",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ any: true }], effects: [{ damage: 1, to: { target: 0 } }], text: 'When this creature enters, it deals 1 damage to any target.' }],
  activated: [landcycling('Mountain')],
});
