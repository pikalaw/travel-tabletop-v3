import { card } from '../script';

// Flexible Waterbender: Vigilance / Waterbend {3}: This creature has base power and toughness 5/2 until end of turn. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '8cf88fa8-2f47-4125-a59d-9c2b2d4765a7',
  name: "Flexible Waterbender",
  activated: [{ cost: { waterbend: 3 }, effects: [{ continuous: { setBase: [5, 2] }, on: 'self', duration: 'endOfTurn' }], text: 'Waterbend {3}: This creature has base power and toughness 5/2 until end of turn.' }],
});
