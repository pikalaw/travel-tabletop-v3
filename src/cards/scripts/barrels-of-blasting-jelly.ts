import { card } from '../script';

// Barrels of Blasting Jelly: {1}: Add one mana of any color. Activate only once each turn. / {5}, {T}, Sacrifice this artifact: It deals 5 damage to target creature.
export default card({
  oracleId: 'c6cd520c-106b-4ee5-bc02-6c5fbdbc78dd',
  name: "Barrels of Blasting Jelly",
  activated: [
    { cost: { mana: '{1}' }, mana: true, oncePerTurn: true, effects: [{ addMana: [], anyColor: true }], text: '{1}: Add one mana of any color. Activate only once each turn.' },
    { cost: { mana: '{5}', tap: true, sacrificeSelf: true }, targets: [{ objects: { types: ['Creature'] } }], effects: [{ damage: 5, to: { target: 0 } }], text: '{5}, {T}, Sacrifice this artifact: It deals 5 damage to target creature.' },
  ],
});
