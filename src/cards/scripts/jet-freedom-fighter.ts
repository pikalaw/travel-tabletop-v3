import { card } from '../script';

// Jet, Freedom Fighter: When Jet enters, he deals damage equal to the number of creatures you control to target creature an opponent controls. / When Jet dies, put a +1/+1 counter on each of up to two target creatures.
export default card({
  oracleId: '77cd2246-6906-4dce-8580-4c9d2e68c477',
  name: "Jet, Freedom Fighter",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'opponent' } }], effects: [{ damage: { count: { types: ['Creature'], controller: 'you' } }, to: { target: 0 } }], text: 'When Jet enters, he deals damage equal to the number of creatures you control to target creature an opponent controls.' },
    { when: { dies: {} }, self: true, targets: [{ objects: { types: ['Creature'] }, count: 2, upTo: true }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'When Jet dies, put a +1/+1 counter on each of up to two target creatures.' },
  ],
});
