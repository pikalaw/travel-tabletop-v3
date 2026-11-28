import { TOKENS } from '../tokens';
import { card } from '../script';

// Callous Inspector: Menace (This creature can't be blocked except by two or more creatures.) / When this creature dies, it deals 1 damage to you. Create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '5d950fd4-8956-4b1a-ab0f-ab31bcffce4e',
  name: "Callous Inspector",
  triggered: [{ when: { dies: {} }, self: true, effects: [{ damage: 1, to: 'you' }, { createToken: TOKENS.clue, n: 1 }], text: 'When this creature dies, it deals 1 damage to you. Create a Clue token.' }],
});
