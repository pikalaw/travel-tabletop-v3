import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Rebellious Captives: Exhaust — {6}: Put two +1/+1 counters on this creature, then earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped. Activate each exhaust ability only once.)
export default card({
  oracleId: '70401db7-edbc-402f-98ef-be74bd316273',
  name: "Rebellious Captives",
  activated: [{ cost: { mana: '{6}' }, exhaust: true, targets: [LAND_YOU_CONTROL], effects: [{ addCounters: '+1/+1', n: 2, on: 'self' }, earthbend(2, 0)], text: 'Exhaust — {6}: Put two +1/+1 counters on this creature, then earthbend 2.' }],
});
