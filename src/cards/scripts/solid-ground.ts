import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Solid Ground: When this enchantment enters, earthbend 3. (Target land you control becomes a 0/0 creature with haste that's still a land. Put three +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.) / If one or more +1/+1 counters would be put on a permanent you control, that many plus one +1/+1 counters are put on it instead.
export default card({
  oracleId: '8609ed1a-f202-483e-9299-408ef6e84ad6',
  name: "Solid Ground",
  triggered: [{ when: { enters: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(3, 0)], text: 'When this enchantment enters, earthbend 3.' }],
  replacements: [{ replace: { moreCounters: '+1/+1', extra: 1, on: { controller: 'you' } }, text: 'If one or more +1/+1 counters would be put on a permanent you control, that many plus one +1/+1 counters are put on it instead.' }],
});
