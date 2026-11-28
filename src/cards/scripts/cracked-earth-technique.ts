import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Cracked Earth Technique: Earthbend 3, then earthbend 3. You gain 3 life. (To earthbend 3, target land you control becomes a 0/0 creature with haste that's still a land. Put three +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'd5314006-afe0-4cdc-88f0-ff1f7d85fba9',
  name: "Cracked Earth Technique",
  spell: { targets: [LAND_YOU_CONTROL, LAND_YOU_CONTROL], effects: [earthbend(3, 0), earthbend(3, 1), { gainLife: 'you', n: 3 }] },
});
