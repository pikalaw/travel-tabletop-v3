import { card } from '../script';

// Food: {2}, {T}, Sacrifice this token: You gain 3 life.
export default card({
  oracleId: 'a468338f-635e-4206-89d6-72d723071d45',
  name: "Food",
  activated: [{ cost: { mana: '{2}', tap: true, sacrificeSelf: true }, effects: [{ gainLife: 'you', n: 3 }], text: '{2}, {T}, Sacrifice this token: You gain 3 life.' }],
});
