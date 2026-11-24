import { card } from '../script';

// Jeong Jeong's Deserters: When this creature enters, put a +1/+1 counter on target creature.
export default card({
  oracleId: '6a06d281-3ca2-498f-91d0-e13e7b0869f9',
  name: "Jeong Jeong's Deserters",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'] } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'When this creature enters, put a +1/+1 counter on target creature.' }],
});
