import { card } from '../script';

// Yuyan Archers: Reach / When this creature enters, you may discard a card. If you do, draw a card.
export default card({
  oracleId: '63e5180f-16d0-4524-94bf-ecbf3c417814',
  name: "Yuyan Archers",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ optional: { discard: 1 }, then: [{ draw: 'you', n: 1 }] }], text: 'When this creature enters, you may discard a card. If you do, draw a card.' }],
});
