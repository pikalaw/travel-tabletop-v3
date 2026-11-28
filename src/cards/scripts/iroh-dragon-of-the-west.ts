import { firebending, mentor } from '../keywords';
import { card } from '../script';

// Iroh, Dragon of the West: Haste / Mentor (Whenever this creature attacks, put a +1/+1 counter on target attacking creature with lesser power.) / At the beginning of combat on your turn, each creature you control with a counter on it gains firebending 2 until end of turn. (Whenever it attacks, add {R}{R}. This mana lasts until end of combat.)
export default card({
  oracleId: '98f9b97b-4c15-4d24-895a-a9bebb68e79b',
  name: "Iroh, Dragon of the West",
  triggered: [
    mentor,
    {
      when: { step: 'beginCombat', whose: 'yours' },
      effects: [{ delayed: firebending(2), about: { all: { types: ['Creature'], controller: 'you', withCounter: '*' } }, each: true, thisTurn: true }],
      text: 'At the beginning of combat on your turn, each creature you control with a counter on it gains firebending 2 until end of turn.',
    },
  ],
});
