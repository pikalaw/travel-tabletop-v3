import { card } from '../script';

// Fire Nation's Conquest: Creatures you control get +1/+0.
export default card({
  oracleId: '8893af49-2f90-4aed-bcaf-905bb9e8ed8f',
  name: "Fire Nation's Conquest",
  statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you' } }, modify: [1, 0] }, text: 'Creatures you control get +1/+0.' }],
});
