import { card } from '../script';

// Suki, Kyoshi Captain: Other Warriors you control get +1/+1. / {3}{W}: Attacking Warriors you control gain double strike until end of turn.
export default card({
  oracleId: '558513bb-a76d-434a-98fc-3707a5d8886a',
  name: "Suki, Kyoshi Captain",
  statics: [{ effect: { affects: { all: { types: ['Creature'], subtypes: ['Warrior'], controller: 'you', other: true } }, modify: [1, 1] }, text: 'Other Warriors you control get +1/+1.' }],
  activated: [{ cost: { mana: '{3}{W}' }, effects: [{ grant: { all: { subtypes: ['Warrior'], attacking: true, controller: 'you' } }, keywords: ['double strike'], duration: 'endOfTurn' }], text: '{3}{W}: Attacking Warriors you control gain double strike until end of turn.' }],
});
