import { card } from '../script';

// Swampsnare Trap: This spell costs {1} less to cast if it targets a creature with flying. / Enchant creature / Enchanted creature gets -5/-3.
export default card({
  oracleId: 'fc532d1d-6cf5-4b59-afb3-325d0bc0db77',
  name: "Swampsnare Trap",
  spell: { effects: [], enchant: { types: ['Creature'] }, reduceIfTargets: { filter: { types: ['Creature'], keyword: 'flying' }, by: 1 } },
  statics: [{ effect: { affects: 'attachedTo', modify: [-5, -3] }, text: 'Enchanted creature gets -5/-3.' }],
});
