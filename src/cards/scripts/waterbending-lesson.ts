import { card } from '../script';

// Waterbending Lesson: Draw three cards. Then discard a card unless you waterbend {2}. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '3d28886c-46bf-4d2e-a257-cb9016cc3573',
  name: "Waterbending Lesson",
  spell: { effects: [{ draw: 'you', n: 3 }, { unlessPays: { waterbend: 2 }, then: [{ discard: 'you', n: 1 }] }] },
});
