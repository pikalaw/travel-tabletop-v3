import { equip } from '../keywords';
import { TOKENS } from '../tokens';
import { card } from '../script';

// Kyoshi Battle Fan: When this Equipment enters, create a 1/1 white Ally creature token, then attach this Equipment to it. / Equipped creature gets +1/+0. / Equip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)
export default card({
  oracleId: '849e54f9-7662-4186-859c-e4f52afbccac',
  name: "Kyoshi Battle Fan",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }, { attach: 'created' }], text: 'When this Equipment enters, create a 1/1 white Ally creature token, then attach this Equipment to it.' }],
  statics: [{ effect: { affects: 'attachedTo', modify: [1, 0] }, text: 'Equipped creature gets +1/+0.' }],
  activated: [equip('{2}')],
});
