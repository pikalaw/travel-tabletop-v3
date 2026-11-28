import { TOKENS } from '../tokens';
import { card } from '../script';

// Lost Days: The owner of target creature or enchantment puts it into their library second from the top or on the bottom. You create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '3bc47eae-cf6f-4b5e-96e1-94a4f307f474',
  name: "Lost Days",
  spell: {
    targets: [{ objects: { types: ['Creature', 'Enchantment'] } }],
    effects: [{ toOwnersLibrary: { target: 0 }, places: ['secondFromTop', 'bottom'] }, { createToken: TOKENS.clue, n: 1 }],
  },
});
