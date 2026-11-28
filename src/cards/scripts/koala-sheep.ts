import { card } from '../script';

// Koala-Sheep: When this creature enters, you gain 3 life.
export default card({
  oracleId: '2e0226eb-20a3-488c-8f2b-f99a5b4d0cf4',
  name: "Koala-Sheep",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ gainLife: 'you', n: 3 }], text: 'When this creature enters, you gain 3 life.' }],
});
