import { card } from '../script';

// Momo, Friendly Flier: Flying / The first non-Lemur creature spell with flying you cast during each of your turns costs {1} less to cast. / Whenever another creature you control with flying enters, Momo gets +1/+1 until end of turn.
export default card({
  oracleId: 'a3c56e71-0de6-447a-a9b4-0971f56c2362',
  name: "Momo, Friendly Flier",
  statics: [{ effect: { affects: 'self', reducesCost: { spells: { types: ['Creature'], keyword: 'flying', notSubtypes: ['Lemur'] }, by: 1, firstEachTurn: true } }, while: 'yourTurn', text: 'The first non-Lemur creature spell with flying you cast during each of your turns costs {1} less to cast.' }],
  triggered: [{ when: { enters: { types: ['Creature'], keyword: 'flying', controller: 'you', other: true } }, effects: [{ pump: 'self', power: 1, toughness: 1, duration: 'endOfTurn' }], text: 'Whenever another creature you control with flying enters, Momo gets +1/+1 until end of turn.' }],
});
