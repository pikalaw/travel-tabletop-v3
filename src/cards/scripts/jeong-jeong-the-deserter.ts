import { firebending } from '../keywords';
import { card } from '../script';

// Jeong Jeong, the Deserter: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / Exhaust — {3}: Put a +1/+1 counter on Jeong Jeong. When you next cast a Lesson spell this turn, copy it and you may choose new targets for the copy. (Activate each exhaust ability only once.)
export default card({
  oracleId: '2158c73d-421b-4c94-af06-dd89cb8d3126',
  name: "Jeong Jeong, the Deserter",
  triggered: [firebending(1)],
  activated: [{
    cost: { mana: '{3}' }, exhaust: true,
    effects: [
      { addCounters: '+1/+1', n: 1, on: 'self' },
      { delayed: { when: { cast: { subtypes: ['Lesson'] }, by: 'you' }, effects: [{ copySpell: 'triggerObject' }], text: 'When you next cast a Lesson spell this turn, copy it.' }, thisTurn: true },
    ],
    text: 'Exhaust — {3}: Put a +1/+1 counter on Jeong Jeong. When you next cast a Lesson spell this turn, copy it and you may choose new targets for the copy.',
  }],
});
