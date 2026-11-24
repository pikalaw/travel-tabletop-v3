import { card } from '../script';

// Geyser Leaper: Flying / Waterbend {4}: Draw a card, then discard a card. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: 'dfdcb451-a597-46fe-893c-49e6dbda5f71',
  name: "Geyser Leaper",
  activated: [{ cost: { waterbend: 4 }, effects: [{ draw: 'you', n: 1 }, { discard: 'you', n: 1 }], text: 'Waterbend {4}: Draw a card, then discard a card.' }],
});
