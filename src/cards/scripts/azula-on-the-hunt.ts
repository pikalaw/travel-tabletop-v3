import { firebending } from '../keywords';
import { TOKENS } from '../tokens';
import { card } from '../script';

// Azula, On the Hunt: Firebending 2 (Whenever this creature attacks, add {R}{R}. This mana lasts until end of combat.) / Whenever Azula attacks, you lose 1 life and create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '89f96032-5cba-404d-82b0-38d2be963e4b',
  name: "Azula, On the Hunt",
  triggered: [firebending(2), { when: { attacks: {} }, self: true, effects: [{ loseLife: 'you', n: 1 }, { createToken: TOKENS.clue, n: 1 }], text: 'Whenever Azula attacks, you lose 1 life and create a Clue token.' }],
});
