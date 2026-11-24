import { card } from '../script';
import { TOKENS } from '../tokens';

// Fire Nation Archers: Reach (This creature can block creatures with flying.) / {5}: This creature deals 2 damage to each opponent. Create a 2/2 red Soldier creature token.
export default card({
  oracleId: '2e735849-1930-4f43-86b4-da660ade15bc',
  name: "Fire Nation Archers",
  activated: [{ cost: { mana: '{5}' }, effects: [{ damage: 2, to: 'opponent' }, { createToken: TOKENS.soldier, n: 1 }], text: '{5}: This creature deals 2 damage to each opponent. Create a 2/2 red Soldier creature token.' }],
});
