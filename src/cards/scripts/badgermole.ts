import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Badgermole: When this creature enters, earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.) / Creatures you control with +1/+1 counters on them have trample.
export default card({
  oracleId: '2084a7f6-226b-4fb4-a30e-703f674d33b4',
  name: "Badgermole",
  triggered: [{ when: { enters: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(2, 0)], text: 'When this creature enters, earthbend 2.' }],
  statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you', withCounter: '+1/+1' } }, addKeywords: ['trample'] }, text: 'Creatures you control with +1/+1 counters on them have trample.' }],
});
