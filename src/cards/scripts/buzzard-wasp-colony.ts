import { card } from '../script';

// Buzzard-Wasp Colony: Flying / When this creature enters, you may sacrifice an artifact or creature. If you do, draw a card. / Whenever another creature you control dies, if it had counters on it, put its counters on this creature.
export default card({
  oracleId: '29fd050c-dd1d-4e1b-b3cc-f7d8d18e4dcb',
  name: "Buzzard-Wasp Colony",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ optional: { sacrifice: { types: ['Artifact', 'Creature'] } }, then: [{ draw: 'you', n: 1 }] }], text: 'When this creature enters, you may sacrifice an artifact or creature. If you do, draw a card.' },
    {
      when: { dies: { types: ['Creature'], controller: 'you', other: true } },
      if: { atLeast: { counters: '*', on: 'triggerObject' }, n: 1 },
      effects: [{ putCountersOf: 'triggerObject', on: 'self' }],
      text: 'Whenever another creature you control dies, if it had counters on it, put its counters on this creature.',
    },
  ],
});
