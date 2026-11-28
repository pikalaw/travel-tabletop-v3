import { TOKENS } from '../tokens';
import { card } from '../script';

// Forecasting Fortune Teller: When this creature enters, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: 'a5a05edd-2a30-414b-b766-f0651d5783f5',
  name: "Forecasting Fortune Teller",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.clue, n: 1 }], text: 'When this creature enters, create a Clue token.' }],
});
