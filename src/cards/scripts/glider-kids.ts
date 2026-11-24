import { card } from '../script';

// Glider Kids: Flying / When this creature enters, scry 1. (Look at the top card of your library. You may put it on the bottom.)
export default card({
  oracleId: 'ff5ce28b-25be-4136-a7b2-8f25c08a6455',
  name: "Glider Kids",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ scry: 1 }], text: 'When this creature enters, scry 1.' }],
});
