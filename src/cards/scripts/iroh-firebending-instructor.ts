import { card } from '../script';

// Iroh, Firebending Instructor: Whenever Iroh attacks, attacking creatures get +1/+1 until end of turn.
export default card({
  oracleId: '8e03797d-dd61-439f-b4ce-996cd71bdcf5',
  name: "Iroh, Firebending Instructor",
  triggered: [{ when: { attacks: {} }, self: true, effects: [{ pump: { all: { types: ['Creature'], attacking: true } }, power: 1, toughness: 1, duration: 'endOfTurn' }], text: 'Whenever Iroh attacks, attacking creatures get +1/+1 until end of turn.' }],
});
