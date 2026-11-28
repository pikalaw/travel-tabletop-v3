import { TOKENS } from '../tokens';
import { card } from '../script';

// Sold Out: Exile target creature. If it was dealt damage this turn, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '6a69d4b1-72dd-4599-a16d-32299de5b0b9',
  name: "Sold Out",
  spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ if: { target: 0, is: { damaged: true } }, then: [{ createToken: TOKENS.clue, n: 1 }] }, { exile: { target: 0 } }] },
});
