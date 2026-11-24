import { firebending } from '../keywords';
import { card } from '../script';

// Rough Rhino Cavalry: Firebending 2 (Whenever this creature attacks, add {R}{R}. This mana lasts until end of combat.) / Exhaust — {8}: Put two +1/+1 counters on this creature. It gains trample until end of turn. (Activate each exhaust ability only once.)
export default card({
  oracleId: '3ac94b28-4b0a-4121-99b9-9cd7dff7948c',
  name: "Rough Rhino Cavalry",
  triggered: [firebending(2)],
  activated: [{ cost: { mana: '{8}' }, exhaust: true, effects: [{ addCounters: '+1/+1', n: 2, on: 'self' }, { grant: 'self', keywords: ['trample'], duration: 'endOfTurn' }], text: 'Exhaust — {8}: Put two +1/+1 counters on this creature. It gains trample until end of turn.' }],
});
