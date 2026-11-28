import { card } from '../script';

// Boar-q-pine: Whenever you cast a noncreature spell, put a +1/+1 counter on this creature.
export default card({
  oracleId: '551e4356-5b1f-475c-a64b-9c50ea9b0368',
  name: "Boar-q-pine",
  triggered: [{ when: { cast: { notTypes: ['Creature'] }, by: 'you' }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever you cast a noncreature spell, put a +1/+1 counter on this creature.' }],
});
