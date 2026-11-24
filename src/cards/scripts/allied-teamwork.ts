import { card } from '../script';
import { TOKENS } from '../tokens';

// Allied Teamwork: When this enchantment enters, create a 1/1 white Ally creature token. / Allies you control get +1/+1.
export default card({
  oracleId: 'ceddea59-de47-4ddd-b424-6e1dcb13ab79',
  name: "Allied Teamwork",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.ally, n: 1 }], text: 'When this enchantment enters, create a 1/1 white Ally creature token.' }],
  statics: [{ effect: { affects: { all: { types: ['Creature'], subtypes: ['Ally'], controller: 'you' } }, modify: [1, 1] }, text: 'Allies you control get +1/+1.' }],
});
