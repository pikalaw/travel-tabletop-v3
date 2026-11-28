import { TOKENS } from '../tokens';
import { card } from '../script';

// Creeping Crystal Coating: Flash / Enchant creature / Enchanted creature gets +0/+3 and has "Whenever this creature attacks, create a Food token." (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")
export default card({
  oracleId: 'c23f2546-bf9e-4390-b6f7-c616920e04ca',
  name: "Creeping Crystal Coating",
  spell: { effects: [], enchant: { types: ['Creature'] } },
  statics: [{ effect: { affects: 'attachedTo', modify: [0, 3] }, text: 'Enchanted creature gets +0/+3.' }],
  // The granted "Whenever this creature attacks" trigger, as the Aura's own: its controller gets the Food.
  triggered: [{ when: { attacks: { attached: true } }, effects: [{ createToken: TOKENS.food, n: 1, controller: { controllerOf: 'attachedTo' } }], text: 'Enchanted creature has "Whenever this creature attacks, create a Food token."' }],
});
