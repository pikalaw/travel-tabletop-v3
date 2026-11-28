import { card } from '../script';

// The Blue Spirit: You may cast the first creature spell you cast each turn as though it had flash. / Whenever a nontoken creature you control enters during combat, draw a card.
export default card({
  oracleId: '497e9c7c-a16d-43e5-a7ec-04153aa2566a',
  name: "The Blue Spirit",
  statics: [{ effect: { affects: 'self', firstCreatureFlash: true }, text: 'You may cast the first creature spell you cast each turn as though it had flash.' }],
  triggered: [{ when: { enters: { types: ['Creature'], controller: 'you', token: false } }, onlyIf: 'duringCombat', effects: [{ draw: 'you', n: 1 }], text: 'Whenever a nontoken creature you control enters during combat, draw a card.' }],
});
