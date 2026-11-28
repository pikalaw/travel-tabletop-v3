import { card } from '../script';

// Walltop Sentries: Reach, deathtouch / When this creature dies, if there's a Lesson card in your graveyard, you gain 2 life.
export default card({
  oracleId: 'fb3a0910-a582-41ef-b5b9-3cda1f1cd5ce',
  name: "Walltop Sentries",
  triggered: [{ when: { dies: {} }, self: true, if: { exists: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, effects: [{ gainLife: 'you', n: 2 }], text: "When this creature dies, if there's a Lesson card in your graveyard, you gain 2 life." }],
});
