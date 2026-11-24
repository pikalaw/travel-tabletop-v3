import { card } from '../script';

// Deserter's Disciple: {T}: Another target creature you control with power 2 or less can't be blocked this turn.
export default card({
  oracleId: '73ca3132-d849-4cf9-beba-75ba09789332',
  name: "Deserter's Disciple",
  activated: [{ cost: { tap: true }, targets: [{ objects: { types: ['Creature'], controller: 'you', other: true, power: { op: '<=', n: 2 } } }], effects: [{ grant: { target: 0 }, keywords: ["can't be blocked"], duration: 'endOfTurn' }], text: "{T}: Another target creature you control with power 2 or less can't be blocked this turn." }],
});
