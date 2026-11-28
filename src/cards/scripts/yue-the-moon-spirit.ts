import { card } from '../script';

// Yue, the Moon Spirit: Flying, vigilance / Waterbend {5}, {T}: You may cast a noncreature spell from your hand without paying its mana cost. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '961f1883-2f97-4249-90f9-416279d7a9dd',
  name: "Yue, the Moon Spirit",
  activated: [{ cost: { waterbend: 5, tap: true }, effects: [{ castFromHand: { notTypes: ['Creature'] } }], text: 'Waterbend {5}, {T}: You may cast a noncreature spell from your hand without paying its mana cost.' }],
});
