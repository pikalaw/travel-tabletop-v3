import { equip } from '../keywords';
import { TOKENS } from '../tokens';
import { card } from '../script';

// Hook Swords: When this Equipment enters, create a 1/1 white Ally creature token, then attach this Equipment to it. / During your turn, equipped creature gets +1/+1 and has first strike. / Equip {3}
export default card({
  oracleId: '610e5fda-ff6c-408d-9d58-ba2b02c5101f',
  name: "Hook Swords",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }, { attach: 'created' }], text: 'When this Equipment enters, create a 1/1 white Ally creature token, then attach this Equipment to it.' }],
  statics: [{ effect: { affects: 'attachedTo', modify: [1, 1], addKeywords: ['first strike'] }, while: 'yourTurn', text: 'During your turn, equipped creature gets +1/+1 and has first strike.' }],
  activated: [equip('{3}')],
});
