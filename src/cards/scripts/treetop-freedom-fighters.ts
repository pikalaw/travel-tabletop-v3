import { TOKENS } from '../tokens';
import { card } from '../script';

// Treetop Freedom Fighters: Haste / When this creature enters, create a 1/1 white Ally creature token.
export default card({
  oracleId: '922176b8-7174-4248-92fb-b196ceb802c7',
  name: "Treetop Freedom Fighters",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }], text: 'When this creature enters, create a 1/1 white Ally creature token.' }],
});
