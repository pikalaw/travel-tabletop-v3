import { card } from '../script';

// Suspicious Bookcase: Defender / {3}, {T}: Target creature can't be blocked this turn.
export default card({
  oracleId: 'ca611c90-7753-43dd-af91-81694d004eeb',
  name: "Suspicious Bookcase",
  activated: [{ cost: { mana: '{3}', tap: true }, targets: [{ objects: { types: ['Creature'] } }], effects: [{ grant: { target: 0 }, keywords: ["can't be blocked"], duration: 'endOfTurn' }], text: '{3}, {T}: Target creature can\'t be blocked this turn.' }],
});
