import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// The Boulder, Ready to Rumble: Whenever The Boulder attacks, earthbend X, where X is the number of creatures you control with power 4 or greater. (Target land you control becomes a 0/0 creature with haste that's still a land. Put X +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'd33ee141-a880-4368-a274-a6ae2f2c624b',
  name: "The Boulder, Ready to Rumble",
  triggered: [{ when: { attacks: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend({ count: { types: ['Creature'], controller: 'you', power: { op: '>=', n: 4 } } }, 0)], text: 'Whenever The Boulder attacks, earthbend X, where X is the number of creatures you control with power 4 or greater.' }],
});
