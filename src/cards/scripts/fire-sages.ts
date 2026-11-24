import { firebending } from '../keywords';
import { card } from '../script';

// Fire Sages: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / {1}{R}{R}: Put a +1/+1 counter on this creature.
export default card({
  oracleId: '08d1940a-ddc6-4b6d-b6c9-9d2aa470b906',
  name: "Fire Sages",
  triggered: [firebending(1)],
  activated: [{ cost: { mana: '{1}{R}{R}' }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: '{1}{R}{R}: Put a +1/+1 counter on this creature.' }],
});
