import { crew } from '../keywords';
import { TOKENS } from '../tokens';
import { card } from '../script';

// Fire Nation Warship: Reach / When this Vehicle dies, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.") / Crew 2 (Tap any number of creatures you control with total power 2 or more: This Vehicle becomes an artifact creature until end of turn.)
export default card({
  oracleId: '987aab63-a889-400f-a3bd-feaef978b407',
  name: "Fire Nation Warship",
  triggered: [{ when: { dies: {} }, self: true, effects: [{ createToken: TOKENS.clue, n: 1 }], text: 'When this Vehicle dies, create a Clue token.' }],
  activated: [crew(2)],
});
