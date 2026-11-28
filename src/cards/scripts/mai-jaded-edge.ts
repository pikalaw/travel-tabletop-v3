import { card } from '../script';

// Mai, Jaded Edge: Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.) / Exhaust — {3}: Put a double strike counter on Mai. (Activate each exhaust ability only once.)
export default card({
  oracleId: 'b5029f21-e0d6-4f22-9afd-79452de26490',
  name: "Mai, Jaded Edge",
  activated: [{ cost: { mana: '{3}' }, exhaust: true, effects: [{ addCounters: 'double strike', n: 1, on: 'self' }], text: 'Exhaust — {3}: Put a double strike counter on Mai.' }],
});
