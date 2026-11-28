import { TOKENS } from '../tokens';
import { card } from '../script';

// Fire Nation Occupation: When this enchantment enters, create a 2/2 red Soldier creature token with firebending 1. (Whenever it attacks, add {R}. This mana lasts until end of combat.) / Whenever you cast a spell during an opponent's turn, create a 2/2 red Soldier creature token with firebending 1.
export default card({
  oracleId: '2a99c0d6-3200-44ff-8d4c-f7a38cecb05f',
  name: "Fire Nation Occupation",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.soldierFirebending, n: 1 }], text: 'When this enchantment enters, create a 2/2 red Soldier creature token with firebending 1.' },
    { when: { cast: {}, by: 'you' }, onlyIf: { not: 'yourTurn' }, effects: [{ createToken: TOKENS.soldierFirebending, n: 1 }], text: "Whenever you cast a spell during an opponent's turn, create a 2/2 red Soldier creature token with firebending 1." },
  ],
});
