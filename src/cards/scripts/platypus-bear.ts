import { card } from '../script';

// Platypus-Bear: Defender / When this creature enters, mill two cards. (Put the top two cards of your library into your graveyard.) / As long as there is a Lesson card in your graveyard, this creature can attack as though it didn't have defender.
export default card({
  oracleId: '933e4e8a-01ea-4f58-8f5e-4f6c43f4e105',
  name: "Platypus-Bear",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ mill: 'you', n: 2 }], text: 'When this creature enters, mill two cards.' }],
  statics: [{ effect: { affects: 'self', addKeywords: ["can attack as though it didn't have defender"] }, while: { exists: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, text: "As long as there is a Lesson card in your graveyard, this creature can attack as though it didn't have defender." }],
});
