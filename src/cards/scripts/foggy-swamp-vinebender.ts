import { card } from '../script';

// Foggy Swamp Vinebender: This creature can't be blocked by creatures with power 2 or less. / Waterbend {5}: Put a +1/+1 counter on this creature. Activate only during your turn. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '82fefb82-a436-488d-8ecd-594686117e34',
  name: "Foggy Swamp Vinebender",
  statics: [{ effect: { affects: 'self', addKeywords: ["can't be blocked by creatures with power 2 or less"] }, text: "This creature can't be blocked by creatures with power 2 or less." }],
  activated: [{ cost: { waterbend: 5 }, timing: 'yourTurn', effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Waterbend {5}: Put a +1/+1 counter on this creature. Activate only during your turn.' }],
});
