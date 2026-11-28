import { TOKENS } from '../tokens';
import { card } from '../script';

// Bosco, Just a Bear: When Bosco enters, create a Food token for each legendary creature you control. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.") / {2}{G}, Sacrifice a Food: Put two +1/+1 counters on Bosco. He gains trample until end of turn.
export default card({
  oracleId: 'a213c650-06cc-4ea8-86f8-78ccfe103b38',
  name: "Bosco, Just a Bear",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.food, n: { count: { supertypes: ['Legendary'], types: ['Creature'], controller: 'you' } } }], text: 'When Bosco enters, create a Food token for each legendary creature you control.' }],
  activated: [{ cost: { mana: '{2}{G}', sacrifice: { subtypes: ['Food'] } }, effects: [{ addCounters: '+1/+1', n: 2, on: 'self' }, { grant: 'self', keywords: ['trample'], duration: 'endOfTurn' }], text: '{2}{G}, Sacrifice a Food: Put two +1/+1 counters on Bosco. He gains trample until end of turn.' }],
});
