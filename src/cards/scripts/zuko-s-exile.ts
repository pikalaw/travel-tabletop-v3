import { TOKENS } from '../tokens';
import { card } from '../script';

// Zuko's Exile: Exile target artifact, creature, or enchantment. Its controller creates a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '5cf18398-9552-415e-a61f-2c149e35ec3d',
  name: "Zuko's Exile",
  spell: {
    targets: [{ objects: { types: ['Artifact', 'Creature', 'Enchantment'] } }],
    effects: [{ createToken: TOKENS.clue, n: 1, controller: { controllerOf: { target: 0 } } }, { exile: { target: 0 } }],
  },
});
