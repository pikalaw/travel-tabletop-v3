import { TOKENS } from '../tokens';
import { card } from '../script';

// Elephant-Mandrill: Reach / When this creature enters, each player creates a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.") / At the beginning of combat on your turn, this creature gets +1/+1 until end of turn for each artifact your opponents control.
export default card({
  oracleId: '8695c7e2-464e-464c-9d3f-a7cf025f3eb2',
  name: "Elephant-Mandrill",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.food, n: 1, controller: 'each' }], text: 'When this creature enters, each player creates a Food token.' },
    {
      when: { step: 'beginCombat', whose: 'yours' },
      effects: [{ pump: 'self', power: { count: { types: ['Artifact'], controller: 'opponent' } }, toughness: { count: { types: ['Artifact'], controller: 'opponent' } }, duration: 'endOfTurn' }],
      text: 'At the beginning of combat on your turn, this creature gets +1/+1 until end of turn for each artifact your opponents control.',
    },
  ],
});
