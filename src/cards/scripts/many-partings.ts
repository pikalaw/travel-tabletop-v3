import { TOKENS } from '../tokens';
import { card } from '../script';

// Many Partings: Search your library for a basic land card, reveal it, put it into your hand, then shuffle. Create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")
export default card({
  oracleId: '92ea750e-62b7-4422-a527-ddf435759d08',
  name: "Many Partings",
  spell: { effects: [{ search: { types: ['Land'], supertypes: ['Basic'] }, to: 'hand' }, { createToken: TOKENS.food, n: 1 }] },
});
