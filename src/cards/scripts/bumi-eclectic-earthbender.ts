import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Bumi, Eclectic Earthbender: When Bumi enters, earthbend 1. (Target land you control becomes a 0/0 creature with haste that's still a land. Put a +1/+1 counter on it. When it dies or is exiled, return it to the battlefield tapped.) / Whenever Bumi attacks, put two +1/+1 counters on each land creature you control.
export default card({
  oracleId: '301af2b2-e2f7-4220-a3f5-7702fb62664a',
  name: "Bumi, Eclectic Earthbender",
  triggered: [
    { when: { enters: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(1, 0)], text: 'When Bumi enters, earthbend 1.' },
    { when: { attacks: {} }, self: true, effects: [{ addCounters: '+1/+1', n: 2, on: { all: { allTypes: ['Land', 'Creature'], controller: 'you' } } }], text: 'Whenever Bumi attacks, put two +1/+1 counters on each land creature you control.' },
  ],
});
