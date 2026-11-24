import { card } from '../script';
import { TOKENS } from '../tokens';

// Path to Redemption: Enchant creature / Enchanted creature can't attack or block. / {5}, Sacrifice this Aura: Exile enchanted creature. Create a 1/1 white Ally creature token. Activate only during your turn.
export default card({
  oracleId: 'ac94860b-70b8-4624-9758-4bb024a56f60',
  name: "Path to Redemption",
  spell: { effects: [], enchant: { types: ['Creature'] } },
  statics: [{ effect: { affects: 'attachedTo', addKeywords: ["can't attack or block"] }, text: "Enchanted creature can't attack or block." }],
  activated: [{
    cost: { mana: '{5}', sacrificeSelf: true }, timing: 'yourTurn',
    effects: [{ exile: 'attachedTo' }, { createToken: TOKENS.ally, n: 1 }],
    text: '{5}, Sacrifice this Aura: Exile enchanted creature. Create a 1/1 white Ally creature token. Activate only during your turn.',
  }],
});
