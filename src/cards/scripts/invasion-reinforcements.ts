import { TOKENS } from '../tokens';
import { card } from '../script';

// Invasion Reinforcements: Flash / When this creature enters, create a 1/1 white Ally creature token.
export default card({
  oracleId: '185316ff-6fb7-4b5c-8a60-3238674562a6',
  name: "Invasion Reinforcements",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }], text: 'When this creature enters, create a 1/1 white Ally creature token.' }],
});
