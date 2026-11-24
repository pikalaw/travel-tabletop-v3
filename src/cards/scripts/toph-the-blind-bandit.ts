import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Toph, the Blind Bandit: When Toph enters, earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.) / Toph's power is equal to the number of +1/+1 counters on lands you control.
export default card({
  oracleId: '2ce20f43-9357-448f-bb40-7315feb08433',
  name: "Toph, the Blind Bandit",
  triggered: [{ when: { enters: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(2, 0)], text: 'When Toph enters, earthbend 2.' }],
  statics: [{ effect: { affects: 'self', cdaPower: { counters: '+1/+1', on: { all: { types: ['Land'], controller: 'you' } } } }, text: "Toph's power is equal to the number of +1/+1 counters on lands you control." }],
});
