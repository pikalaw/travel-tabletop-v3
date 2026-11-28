import { card } from '../script';

// Kyoshi Warrior Exemplars: Whenever this creature attacks, if you control eight or more lands, creatures you control get +2/+2 until end of turn.
export default card({
  oracleId: '4bb0596f-df1d-4977-bb8b-4d2e6648dcb3',
  name: "Kyoshi Warrior Exemplars",
  triggered: [{
    when: { attacks: {} }, self: true, if: { atLeast: { count: { types: ['Land'], controller: 'you' } }, n: 8 },
    effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: 2, toughness: 2, duration: 'endOfTurn' }],
    text: 'Whenever this creature attacks, if you control eight or more lands, creatures you control get +2/+2 until end of turn.',
  }],
});
