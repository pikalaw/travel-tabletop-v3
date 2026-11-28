import { card } from '../script';

// Cathartic Reunion: As an additional cost to cast this spell, discard two cards. / Draw three cards.
export default card({
  oracleId: '0f3c3e5f-6af3-4af2-8703-4ccc8ed8f675',
  name: "Cathartic Reunion",
  spell: { additionalCost: { discard: 2 }, effects: [{ draw: 'you', n: 3 }] },
});
