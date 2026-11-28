import { TOKENS } from '../tokens';
import { card } from '../script';

// Cunning Maneuver: Target creature gets +3/+1 until end of turn. / Create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '96335212-ec57-4beb-bab1-11c8eaa62119',
  name: "Cunning Maneuver",
  spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: 3, toughness: 1, duration: 'endOfTurn' }, { createToken: TOKENS.clue, n: 1 }] },
});
