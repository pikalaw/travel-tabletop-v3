import { firebending } from '../keywords';
import { card } from '../script';

// Zuko, Exiled Prince: Firebending 3 (Whenever this creature attacks, add {R}{R}{R}. This mana lasts until end of combat.) / {3}: Exile the top card of your library. You may play that card this turn.
export default card({
  oracleId: '3231ce2e-d4f8-44fc-872d-aeafa59aed4b',
  name: "Zuko, Exiled Prince",
  triggered: [firebending(3)],
  activated: [{ cost: { mana: '{3}' }, effects: [{ exileTopPlayable: true }], text: '{3}: Exile the top card of your library. You may play that card this turn.' }],
});
