import { TOKENS } from '../tokens';
import { card } from '../script';

// Crescent Island Temple: When Crescent Island Temple enters, for each Shrine you control, create a 1/1 red Monk creature token with prowess. (Whenever you cast a noncreature spell, it gets +1/+1 until end of turn.) / Whenever another Shrine you control enters, create a 1/1 red Monk creature token with prowess.
export default card({
  oracleId: '2886f95e-c4e8-4770-b7de-40985f336cfb',
  name: "Crescent Island Temple",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.monk, n: { count: { subtypes: ['Shrine'], controller: 'you' } } }], text: 'When Crescent Island Temple enters, for each Shrine you control, create a 1/1 red Monk creature token with prowess.' },
    { when: { enters: { subtypes: ['Shrine'], controller: 'you', other: true } }, effects: [{ createToken: TOKENS.monk, n: 1 }], text: 'Whenever another Shrine you control enters, create a 1/1 red Monk creature token with prowess.' },
  ],
});
