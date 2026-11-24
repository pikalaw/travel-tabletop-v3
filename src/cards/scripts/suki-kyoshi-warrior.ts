import { card } from '../script';
import { TOKENS } from '../tokens';

// Suki, Kyoshi Warrior: Suki's power is equal to the number of creatures you control. / Whenever Suki attacks, create a 1/1 white Ally creature token that's tapped and attacking.
export default card({
  oracleId: '9223488e-5206-4d43-90ef-387189dcee16',
  name: "Suki, Kyoshi Warrior",
  statics: [{ effect: { affects: 'self', cdaPower: { count: { types: ['Creature'], controller: 'you' } } }, text: "Suki's power is equal to the number of creatures you control." }],
  triggered: [{ when: { attacks: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1, attacking: true }], text: "Whenever Suki attacks, create a 1/1 white Ally creature token that's tapped and attacking." }],
});
