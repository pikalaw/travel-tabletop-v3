import { card } from '../script';

// Katara, Waterbending Master: Whenever you cast a spell during an opponent's turn, you get an experience counter. / Whenever Katara attacks, you may draw a card for each experience counter you have. If you do, discard a card.
export default card({
  oracleId: '2e3af413-6706-4023-871a-e5e49da5beab',
  name: "Katara, Waterbending Master",
  triggered: [
    { when: { cast: {}, by: 'you' }, onlyIf: { not: 'yourTurn' }, effects: [{ playerCounter: 'experience', n: 1, player: 'you' }], text: "Whenever you cast a spell during an opponent's turn, you get an experience counter." },
    { when: { attacks: {} }, self: true, effects: [{ may: [{ draw: 'you', n: { playerCounters: 'experience' } }, { discard: 'you', n: 1 }], text: 'draw a card for each experience counter you have, then discard a card' }], text: 'Whenever Katara attacks, you may draw a card for each experience counter you have. If you do, discard a card.' },
  ],
});
