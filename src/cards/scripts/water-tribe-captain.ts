import { card } from '../script';

// Water Tribe Captain: {5}: Creatures you control get +1/+1 until end of turn.
export default card({
  oracleId: '0c6c4921-c6cb-4b4b-ac9d-10ccc89a5d1d',
  name: "Water Tribe Captain",
  activated: [{ cost: { mana: '{5}' }, effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: 1, toughness: 1, duration: 'endOfTurn' }], text: '{5}: Creatures you control get +1/+1 until end of turn.' }],
});
