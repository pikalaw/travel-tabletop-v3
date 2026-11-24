import { card } from '../script';

// Turtle-Duck: {3}: Until end of turn, this creature has base power 4 and gains trample.
export default card({
  oracleId: 'e93782e3-1b93-459a-a7de-06c3b6591e6f',
  name: "Turtle-Duck",
  activated: [{ cost: { mana: '{3}' }, effects: [{ continuous: { setBasePower: 4, addKeywords: ['trample'] }, on: 'self', duration: 'endOfTurn' }], text: '{3}: Until end of turn, this creature has base power 4 and gains trample.' }],
});
