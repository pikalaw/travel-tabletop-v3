import { firebending } from '../keywords';
import { card } from '../script';

// Uncle Iroh: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / Lesson spells you cast cost {1} less to cast.
export default card({
  oracleId: '8a98ddac-7341-4118-b188-51d8d03afd1d',
  name: "Uncle Iroh",
  triggered: [firebending(1)],
  statics: [{ effect: { affects: 'self', reducesCost: { spells: { subtypes: ['Lesson'] }, by: 1 } }, text: 'Lesson spells you cast cost {1} less to cast.' }],
});
