import { firebending } from '../keywords';
import { card } from '../script';

// Azula, Ruthless Firebender: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / Whenever Azula attacks, you may discard a card. Then you get an experience counter for each player who discarded a card this turn. / {2}{B}: Until end of turn, Azula gets +1/+1 for each experience counter you have and gains menace.
export default card({
  oracleId: '7139ead5-86f0-46ae-8a6d-ad66d0408f73',
  name: "Azula, Ruthless Firebender",
  triggered: [
    firebending(1),
    { when: { attacks: {} }, self: true, effects: [{ optional: { discard: 1 }, then: [] }, { playerCounter: 'experience', n: { thisTurn: 'playersWhoDiscarded' }, player: 'you' }], text: 'Whenever Azula attacks, you may discard a card. Then you get an experience counter for each player who discarded a card this turn.' },
  ],
  activated: [{ cost: { mana: '{2}{B}' }, effects: [{ pump: 'self', power: { playerCounters: 'experience' }, toughness: { playerCounters: 'experience' }, duration: 'endOfTurn' }, { grant: 'self', keywords: ['menace'], duration: 'endOfTurn' }], text: '{2}{B}: Until end of turn, Azula gets +1/+1 for each experience counter you have and gains menace.' }],
});
