import { card } from '../script';

// Razor Rings: Razor Rings deals 4 damage to target attacking or blocking creature. You gain life equal to the excess damage dealt this way.
export default card({
  oracleId: 'eb5afbd7-4d21-4449-9204-eeb4ebf6a72a',
  name: "Razor Rings",
  spell: {
    targets: [{ objects: { types: ['Creature'], anyOf: [{ attacking: true }, { blocking: true }] } }],
    effects: [{ damage: 4, to: { target: 0 } }, { gainLife: 'you', n: 'excessDamage' }],
  },
});
