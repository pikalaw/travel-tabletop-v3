import { TOKENS } from '../tokens';
import { card } from '../script';

// Kyoshi Warriors: When this creature enters, create a 1/1 white Ally creature token.
export default card({
  oracleId: 'b29abb09-75ea-431c-ab60-f2940d002e83',
  name: "Kyoshi Warriors",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }], text: 'When this creature enters, create a 1/1 white Ally creature token.' }],
});
