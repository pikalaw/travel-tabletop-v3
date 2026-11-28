import { TOKENS } from '../tokens';
import { card } from '../script';

// The Art of Tea: Put a +1/+1 counter on up to one target creature you control. Create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")
export default card({
  oracleId: '9ed4e48f-91bd-45f9-9f31-a2705b330713',
  name: "The Art of Tea",
  spell: { targets: [{ objects: { types: ['Creature'], controller: 'you' }, upTo: true }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }, { createToken: TOKENS.food, n: 1 }] },
});
