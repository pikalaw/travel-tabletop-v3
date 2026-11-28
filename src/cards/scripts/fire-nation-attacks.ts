import { TOKENS } from '../tokens';
import { card } from '../script';

// Fire Nation Attacks: Create two 2/2 red Soldier creature tokens with firebending 1. (Whenever a creature with firebending 1 attacks, add {R}. This mana lasts until end of combat.) / Flashback {8}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)
export default card({
  oracleId: '399fba23-fc13-440b-ab67-192eede6ecab',
  name: "Fire Nation Attacks",
  spell: { effects: [{ createToken: TOKENS.soldierFirebending, n: 2 }], flashback: '{8}{R}' },
});
