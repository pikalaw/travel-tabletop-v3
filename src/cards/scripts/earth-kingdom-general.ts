import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Earth Kingdom General: When this creature enters, earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.) / Whenever you put one or more +1/+1 counters on a creature, you may gain that much life. Do this only once each turn.
export default card({
  oracleId: 'e43c31ee-1bac-4f96-8b74-334b3238ab73',
  name: "Earth Kingdom General",
  triggered: [
    { when: { enters: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(2, 0)], text: 'When this creature enters, earthbend 2.' },
    { when: { countersPut: { types: ['Creature'] }, kind: '+1/+1' }, effects: [{ may: [{ gainLife: 'you', n: 'eventAmount' }], text: 'gain that much life', oncePerTurn: true }], text: 'Whenever you put one or more +1/+1 counters on a creature, you may gain that much life. Do this only once each turn.' },
  ],
});
