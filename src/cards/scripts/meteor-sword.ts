import { equip } from '../keywords';
import { card } from '../script';

// Meteor Sword: When this Equipment enters, destroy target permanent. / Equipped creature gets +3/+3. / Equip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)
export default card({
  oracleId: '181965fb-e685-4b1f-9bd6-3a33bed933b2',
  name: "Meteor Sword",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: {} }], effects: [{ destroy: { target: 0 } }], text: 'When this Equipment enters, destroy target permanent.' }],
  statics: [{ effect: { affects: 'attachedTo', modify: [3, 3] }, text: 'Equipped creature gets +3/+3.' }],
  activated: [equip('{3}')],
});
