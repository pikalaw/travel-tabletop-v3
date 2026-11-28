import { card } from '../script';

// Inspired Insurgent: {1}, Sacrifice this creature: Destroy target artifact or enchantment.
export default card({
  oracleId: '5863c67b-a47c-4466-8bd1-210ab26e0d3f',
  name: "Inspired Insurgent",
  activated: [{ cost: { mana: '{1}', sacrificeSelf: true }, targets: [{ objects: { types: ['Artifact', 'Enchantment'] } }], effects: [{ destroy: { target: 0 } }], text: '{1}, Sacrifice this creature: Destroy target artifact or enchantment.' }],
});
