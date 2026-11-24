import { card } from '../script';

// Flopsie, Bumi's Buddy: When Flopsie enters, put a +1/+1 counter on each creature you control. / Each creature you control with power 4 or greater can't be blocked by more than one creature.
export default card({
  oracleId: 'a8966245-501c-47e4-8ce0-849dcb532eb2',
  name: "Flopsie, Bumi's Buddy",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ addCounters: '+1/+1', n: 1, on: { all: { types: ['Creature'], controller: 'you' } } }], text: 'When Flopsie enters, put a +1/+1 counter on each creature you control.' }],
  statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you', power: { op: '>=', n: 4 } } }, addKeywords: ["can't be blocked by more than one creature"] }, text: "Each creature you control with power 4 or greater can't be blocked by more than one creature." }],
});
