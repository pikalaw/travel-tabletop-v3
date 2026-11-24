import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Earth Village Ruffians: When this creature dies, earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: '0380e99c-18f9-4472-8223-bb208e5f0963',
  name: "Earth Village Ruffians",
  triggered: [{ when: { dies: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(2, 0)], text: 'When this creature dies, earthbend 2.' }],
});
