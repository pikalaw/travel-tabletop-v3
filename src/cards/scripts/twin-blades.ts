import { equip } from '../keywords';
import { card } from '../script';

// Twin Blades: Flash / When this Equipment enters, attach it to target creature you control. That creature gains double strike until end of turn. / Equipped creature gets +1/+1. / Equip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)
export default card({
  oracleId: '88b076a4-46ff-4a41-95a5-2821f4d8944d',
  name: "Twin Blades",
  triggered: [{
    when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
    effects: [{ attach: { target: 0 } }, { grant: { target: 0 }, keywords: ['double strike'], duration: 'endOfTurn' }],
    text: 'When this Equipment enters, attach it to target creature you control. That creature gains double strike until end of turn.',
  }],
  statics: [{ effect: { affects: 'attachedTo', modify: [1, 1] }, text: 'Equipped creature gets +1/+1.' }],
  activated: [equip('{2}')],
});
