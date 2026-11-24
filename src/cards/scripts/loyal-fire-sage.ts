import { firebending } from '../keywords';
import { card } from '../script';
import { TOKENS } from '../tokens';

// Loyal Fire Sage: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / {5}: Create a 1/1 white Ally creature token.
export default card({
  oracleId: '0c052420-2d8b-4bbf-8197-b8a36e7208c9',
  name: "Loyal Fire Sage",
  triggered: [firebending(1)],
  activated: [{ cost: { mana: '{5}' }, effects: [{ createToken: TOKENS.ally, n: 1 }], text: '{5}: Create a 1/1 white Ally creature token.' }],
});
