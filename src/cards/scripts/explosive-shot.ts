import { card } from '../script';

// Explosive Shot: Explosive Shot deals 4 damage to target creature.
export default card({
  oracleId: 'a6081d17-599b-4fd2-bd68-55eca939213a',
  name: "Explosive Shot",
  spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ damage: 4, to: { target: 0 } }] },
});
