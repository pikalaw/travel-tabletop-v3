import { TOKENS } from '../tokens';
import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Bumi's Feast Lecture: Create a Food token. Then earthbend X, where X is twice the number of Foods you control. (A Food token is an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life." To earthbend X, target land you control becomes a 0/0 creature with haste that's still a land. Put X +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: '41f53bb5-8a62-4e6b-b9c3-5aa530a036bc',
  name: "Bumi's Feast Lecture",
  spell: { targets: [LAND_YOU_CONTROL], effects: [{ createToken: TOKENS.food, n: 1 }, earthbend({ times: { count: { subtypes: ['Food'], controller: 'you' } }, by: 2 }, 0)] },
});
