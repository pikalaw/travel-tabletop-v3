import { card } from '../script';
import { TOKENS } from '../tokens';

// Pretending Poxbearers: When this creature dies, create a 1/1 white Ally creature token.
export default card({
  oracleId: 'fefef024-3a05-4221-bb74-419ee08716e5',
  name: "Pretending Poxbearers",
  triggered: [{ when: { dies: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }], text: 'When this creature dies, create a 1/1 white Ally creature token.' }],
});
