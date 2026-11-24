import { card } from '../script';
import { TOKENS } from '../tokens';

// Zuko, Avatar Hunter: Reach (This creature can block creatures with flying.) / Whenever you cast a red spell, create a 2/2 red Soldier creature token.
export default card({
  oracleId: 'd445a584-98e7-4501-bb20-e76c9cafa757',
  name: "Zuko, Avatar Hunter",
  triggered: [{ when: { cast: { colors: ['R'] }, by: 'you' }, effects: [{ createToken: TOKENS.soldier, n: 1 }], text: 'Whenever you cast a red spell, create a 2/2 red Soldier creature token.' }],
});
