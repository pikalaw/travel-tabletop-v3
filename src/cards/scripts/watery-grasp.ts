import { card } from '../script';

// Watery Grasp: Enchant creature / Enchanted creature doesn't untap during its controller's untap step. / Waterbend {5}: Enchanted creature's owner shuffles it into their library. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: '520b2799-66bd-40bf-9bc0-9cd3aed321f5',
  name: "Watery Grasp",
  spell: { effects: [], enchant: { types: ['Creature'] } },
  statics: [{ effect: { affects: 'attachedTo', addKeywords: ["doesn't untap"] }, text: "Enchanted creature doesn't untap during its controller's untap step." }],
  activated: [{ cost: { waterbend: 5 }, effects: [{ shuffleIntoLibrary: 'attachedTo' }], text: "Waterbend {5}: Enchanted creature's owner shuffles it into their library." }],
});
