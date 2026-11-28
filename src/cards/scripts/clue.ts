import { card } from '../script';

// Clue: {2}, Sacrifice this token: Draw a card.
export default card({
  oracleId: '496e1083-c792-40a4-adf4-fec1d559cd5e',
  name: "Clue",
  activated: [{ cost: { mana: '{2}', sacrificeSelf: true }, effects: [{ draw: 'you', n: 1 }], text: '{2}, Sacrifice this token: Draw a card.' }],
});
