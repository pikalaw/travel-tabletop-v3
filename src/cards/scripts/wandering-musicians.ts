import { card } from '../script';

// Wandering Musicians: Whenever this creature attacks, creatures you control get +1/+0 until end of turn.
export default card({
  oracleId: '7166bf81-05c2-457d-a0bb-a175175b8e79',
  name: "Wandering Musicians",
  triggered: [{ when: { attacks: {} }, self: true, effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: 1, toughness: 0, duration: 'endOfTurn' }], text: 'Whenever this creature attacks, creatures you control get +1/+0 until end of turn.' }],
});
