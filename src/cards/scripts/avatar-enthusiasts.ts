import { card } from '../script';

// Avatar Enthusiasts: Whenever another Ally you control enters, put a +1/+1 counter on this creature.
export default card({
  oracleId: '7b0d9d79-2e86-4079-8db3-500483c8807e',
  name: "Avatar Enthusiasts",
  triggered: [{ when: { enters: { subtypes: ['Ally'], controller: 'you', other: true } }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever another Ally you control enters, put a +1/+1 counter on this creature.' }],
});
