import { TOKENS } from '../tokens';
import { card } from '../script';

// Knowledge Seeker: Vigilance / Whenever you draw your second card each turn, put a +1/+1 counter on this creature. / When this creature dies, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: 'bdc2d980-ca14-4040-a9a1-786d724dc65c',
  name: "Knowledge Seeker",
  triggered: [
    { when: { drawsNth: 2 }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever you draw your second card each turn, put a +1/+1 counter on this creature.' },
    { when: { dies: {} }, self: true, effects: [{ createToken: TOKENS.clue, n: 1 }], text: 'When this creature dies, create a Clue token.' },
  ],
});
