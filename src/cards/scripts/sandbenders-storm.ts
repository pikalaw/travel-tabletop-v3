import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Sandbenders' Storm: Choose one — / • Destroy target creature with power 4 or greater. / • Earthbend 3. (Target land you control becomes a 0/0 creature with haste that's still a land. Put three +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'dfc8b8de-be1d-4f7f-bb21-4761a0e7db4e',
  name: "Sandbenders' Storm",
  spell: { effects: [], modes: { min: 1, max: 1, options: [
    { targets: [{ objects: { types: ['Creature'], power: { op: '>=', n: 4 } } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target creature with power 4 or greater.' },
    { targets: [LAND_YOU_CONTROL], effects: [earthbend(3, 0)], text: 'Earthbend 3.' },
  ] } },
});
