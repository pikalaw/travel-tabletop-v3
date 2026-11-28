import { card } from '../script';

// Kindly Customer: When this creature enters, draw a card.
export default card({
  oracleId: '3faab84f-7055-4554-b948-181928d8d4e2',
  name: "Kindly Customer",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ draw: 'you', n: 1 }], text: 'When this creature enters, draw a card.' }],
});
