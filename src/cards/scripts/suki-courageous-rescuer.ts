import { TOKENS } from '../tokens';
import { card } from '../script';

// Suki, Courageous Rescuer: Other creatures you control get +1/+0. / Whenever another permanent you control leaves the battlefield during your turn, create a 1/1 white Ally creature token. This ability triggers only once each turn.
export default card({
  oracleId: '70ea1a9d-ec52-4c11-8c4d-0d957e5491ad',
  name: "Suki, Courageous Rescuer",
  statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you', other: true } }, modify: [1, 0] }, text: 'Other creatures you control get +1/+0.' }],
  triggered: [{ when: { leaves: { controller: 'you', other: true } }, onlyIf: 'yourTurn', oncePerTurn: true, effects: [{ createToken: TOKENS.ally, n: 1 }], text: 'Whenever another permanent you control leaves the battlefield during your turn, create a 1/1 white Ally creature token. This ability triggers only once each turn.' }],
});
