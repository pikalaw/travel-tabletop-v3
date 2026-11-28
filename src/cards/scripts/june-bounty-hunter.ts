import { TOKENS } from '../tokens';
import { card } from '../script';

// June, Bounty Hunter: June can't be blocked as long as you've drawn two or more cards this turn. / {1}, Sacrifice another creature: Create a Clue token. Activate only during your turn. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '1779869a-5e54-4ab5-86b8-d4d20e2e1ba4',
  name: "June, Bounty Hunter",
  statics: [{ effect: { affects: 'self', addKeywords: ["can't be blocked"] }, while: { drawnThisTurn: 2 }, text: "June can't be blocked as long as you've drawn two or more cards this turn." }],
  activated: [{ cost: { mana: '{1}', sacrifice: { types: ['Creature'], other: true } }, timing: 'yourTurn', effects: [{ createToken: TOKENS.clue, n: 1 }], text: '{1}, Sacrifice another creature: Create a Clue token. Activate only during your turn.' }],
});
