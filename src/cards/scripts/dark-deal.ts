import { card } from '../script';

// Dark Deal: Each player discards all the cards in their hand, then draws that many cards minus one.
export default card({
  oracleId: 'c527eb80-ccac-40b8-8377-c31121613128',
  name: "Dark Deal",
  spell: { effects: [{ discardHandDraw: 'each', minus: 1 }] },
});
