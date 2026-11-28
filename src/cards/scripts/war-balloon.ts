import { crew } from '../keywords';
import { card } from '../script';

// War Balloon: Flying / {1}: Put a fire counter on this Vehicle. / As long as this Vehicle has three or more fire counters on it, it's an artifact creature. / Crew 3 (Tap any number of creatures you control with total power 3 or more: This Vehicle becomes an artifact creature until end of turn.)
export default card({
  oracleId: '021b495d-236f-4274-988d-2dfd7103c9ef',
  name: "War Balloon",
  activated: [{ cost: { mana: '{1}' }, effects: [{ addCounters: 'fire', n: 1, on: 'self' }], text: '{1}: Put a fire counter on this Vehicle.' }, crew(3)],
  statics: [{ effect: { affects: 'self', addTypes: ['Creature'] }, while: { atLeast: { counters: 'fire', on: 'self' }, n: 3 }, text: "As long as this Vehicle has three or more fire counters on it, it's an artifact creature." }],
});
