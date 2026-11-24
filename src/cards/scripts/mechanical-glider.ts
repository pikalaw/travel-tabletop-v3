import { equip } from '../keywords';
import { card } from '../script';

// Mechanical Glider: When this Equipment enters, attach it to target creature you control. / Equipped creature has flying. (It can't be blocked except by creatures with flying or reach.) / Equip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)
export default card({
  oracleId: 'd53d1805-c4ec-4b42-a226-3cd78cd2be84',
  name: "Mechanical Glider",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ attach: { target: 0 } }], text: 'When this Equipment enters, attach it to target creature you control.' }],
  statics: [{ effect: { affects: 'attachedTo', addKeywords: ['flying'] }, text: 'Equipped creature has flying.' }],
  activated: [equip('{2}')],
});
