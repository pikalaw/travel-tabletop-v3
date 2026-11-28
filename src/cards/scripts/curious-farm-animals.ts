import { card } from '../script';

// Curious Farm Animals: When this creature dies, you gain 3 life. / {2}, Sacrifice this creature: Destroy up to one target artifact or enchantment.
export default card({
  oracleId: 'e451b5aa-5832-42b3-8d72-f67e126a529f',
  name: "Curious Farm Animals",
  triggered: [{ when: { dies: {} }, self: true, effects: [{ gainLife: 'you', n: 3 }], text: 'When this creature dies, you gain 3 life.' }],
  activated: [{ cost: { mana: '{2}', sacrificeSelf: true }, targets: [{ objects: { types: ['Artifact', 'Enchantment'] }, upTo: true }], effects: [{ destroy: { target: 0 } }], text: '{2}, Sacrifice this creature: Destroy up to one target artifact or enchantment.' }],
});
