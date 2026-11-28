import { TOKENS } from '../tokens';
import { card } from '../script';

// Fire Nation Raider: Raid — When this creature enters, if you attacked this turn, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: 'b37e9bc5-6a2c-4f08-b856-3f8d0d16defb',
  name: "Fire Nation Raider",
  triggered: [{ when: { enters: {} }, self: true, if: { thisTurn: 'youAttacked' }, effects: [{ createToken: TOKENS.clue, n: 1 }], text: 'Raid — When this creature enters, if you attacked this turn, create a Clue token.' }],
});
