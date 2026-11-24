import { card } from '../script';

// Beetle-Headed Merchants: Whenever this creature attacks, you may sacrifice another creature or artifact. If you do, draw a card and put a +1/+1 counter on this creature.
export default card({
  oracleId: '0e6609b4-f359-4bf1-a06e-f4317a0e7b3c',
  name: "Beetle-Headed Merchants",
  triggered: [{
    when: { attacks: {} }, self: true,
    effects: [{ optional: { sacrifice: { anyOf: [{ types: ['Creature'] }, { types: ['Artifact'] }], other: true } }, then: [{ draw: 'you', n: 1 }, { addCounters: '+1/+1', n: 1, on: 'self' }] }],
    text: 'Whenever this creature attacks, you may sacrifice another creature or artifact. If you do, draw a card and put a +1/+1 counter on this creature.',
  }],
});
