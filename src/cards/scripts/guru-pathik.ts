import { card } from '../script';

// Guru Pathik: When Guru Pathik enters, look at the top five cards of your library. You may reveal a Lesson, Saga, or Shrine card from among them and put it into your hand. Put the rest on the bottom of your library in a random order. / Whenever you cast a Lesson, Saga, or Shrine spell, put a +1/+1 counter on another target creature you control.
export default card({
  oracleId: '4dcd7b78-ce5a-43eb-a16d-3b9ea411795d',
  name: "Guru Pathik",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ lookAtTop: 5, mayTake: { subtypes: ['Lesson', 'Saga', 'Shrine'] }, rest: 'bottomRandom' }], text: 'When Guru Pathik enters, look at the top five cards of your library. You may reveal a Lesson, Saga, or Shrine card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.' },
    { when: { cast: { subtypes: ['Lesson', 'Saga', 'Shrine'] }, by: 'you' }, targets: [{ objects: { types: ['Creature'], controller: 'you', other: true } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'Whenever you cast a Lesson, Saga, or Shrine spell, put a +1/+1 counter on another target creature you control.' },
  ],
});
