import { TOKENS } from '../tokens';
import { card } from '../script';

// Messenger Hawk: Flying / When this creature enters, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.") / This creature gets +2/+0 as long as you've drawn two or more cards this turn.
export default card({
  oracleId: '4029e884-8154-42b3-ae29-3cb98374a294',
  name: "Messenger Hawk",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.clue, n: 1 }], text: 'When this creature enters, create a Clue token.' }],
  statics: [{ effect: { affects: 'self', modify: [2, 0] }, while: { drawnThisTurn: 2 }, text: "This creature gets +2/+0 as long as you've drawn two or more cards this turn." }],
});
