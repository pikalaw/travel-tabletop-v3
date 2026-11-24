import { card } from '../script';

// Earth Kingdom Soldier: Vigilance / When this creature enters, put a +1/+1 counter on each of up to two target creatures you control.
export default card({
  oracleId: '4289f2d4-3db2-4dd1-9c18-af3f78309844',
  name: "Earth Kingdom Soldier",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you' }, count: 2, upTo: true }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'When this creature enters, put a +1/+1 counter on each of up to two target creatures you control.' }],
});
