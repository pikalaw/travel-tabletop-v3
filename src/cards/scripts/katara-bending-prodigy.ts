import { card } from '../script';

// Katara, Bending Prodigy: At the beginning of your end step, if Katara is tapped, put a +1/+1 counter on her. / Waterbend {6}: Draw a card. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '55adde23-c818-40fe-9bba-123de93568a5',
  name: "Katara, Bending Prodigy",
  triggered: [{ when: { step: 'end', whose: 'yours' }, if: { exists: { types: ['Creature'], tapped: true, self: true } }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'At the beginning of your end step, if Katara is tapped, put a +1/+1 counter on her.' }],
  activated: [{ cost: { waterbend: 6 }, effects: [{ draw: 'you', n: 1 }], text: 'Waterbend {6}: Draw a card.' }],
});
