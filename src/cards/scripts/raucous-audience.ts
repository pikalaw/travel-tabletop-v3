import { card } from '../script';

// Raucous Audience: {T}: Add {G}. If you control a creature with power 4 or greater, add {G}{G} instead.
export default card({
  oracleId: '5be6f245-31cf-4294-ace0-ca6ce3463fed',
  name: "Raucous Audience",
  activated: [{
    cost: { tap: true }, mana: true, text: '{T}: Add {G}. If you control a creature with power 4 or greater, add {G}{G} instead.',
    effects: [{ if: { exists: { types: ['Creature'], controller: 'you', power: { op: '>=', n: 4 } } }, then: [{ addMana: ['G'], n: 2 }], else: [{ addMana: ['G'] }] }],
  }],
});
