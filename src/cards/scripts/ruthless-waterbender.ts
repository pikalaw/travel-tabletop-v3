import { card } from '../script';

// Ruthless Waterbender: Waterbend {2}: This creature gets +1/+1 until end of turn. Activate only during your turn. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '100771fd-07db-47be-ada3-935dc918fa33',
  name: "Ruthless Waterbender",
  activated: [{ cost: { waterbend: 2 }, timing: 'yourTurn', effects: [{ pump: 'self', power: 1, toughness: 1, duration: 'endOfTurn' }], text: 'Waterbend {2}: This creature gets +1/+1 until end of turn. Activate only during your turn.' }],
});
