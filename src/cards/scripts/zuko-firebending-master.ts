import { firebending } from '../keywords';
import { card } from '../script';

// Zuko, Firebending Master: First strike / Firebending X, where X is the number of experience counters you have. (Whenever this creature attacks, add X {R}. This mana lasts until end of combat.) / Whenever you cast a spell during combat, you get an experience counter.
export default card({
  oracleId: '33db6dc8-2c88-4a7f-8d4d-3bc9fb6544b2',
  name: "Zuko, Firebending Master",
  triggered: [
    firebending({ playerCounters: 'experience' }),
    { when: { cast: {}, by: 'you' }, onlyIf: 'duringCombat', effects: [{ playerCounter: 'experience', n: 1, player: 'you' }], text: 'Whenever you cast a spell during combat, you get an experience counter.' },
  ],
});
