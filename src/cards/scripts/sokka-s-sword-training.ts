import { TOKENS } from '../tokens';
import { card } from '../script';

// Sokka's Sword Training: Target creature gets +2/+2 until end of turn. / Create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '19963c90-e7b2-4935-adcd-d41f0faf401a',
  name: "Sokka's Sword Training",
  spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }, { createToken: TOKENS.clue, n: 1 }] },
});
