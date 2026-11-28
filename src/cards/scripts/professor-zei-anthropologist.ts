import { card } from '../script';

// Professor Zei, Anthropologist: {T}, Discard a card: Draw a card. / {1}, {T}, Sacrifice Professor Zei: Return target instant or sorcery card from your graveyard to your hand. Activate only during your turn.
export default card({
  oracleId: '59a10335-72df-44a5-a514-5bac392cd282',
  name: "Professor Zei, Anthropologist",
  activated: [
    { cost: { tap: true, discard: 1 }, effects: [{ draw: 'you', n: 1 }], text: '{T}, Discard a card: Draw a card.' },
    { cost: { mana: '{1}', tap: true, sacrificeSelf: true }, timing: 'yourTurn', targets: [{ objects: { types: ['Instant', 'Sorcery'], zone: 'graveyard', controller: 'you' } }], effects: [{ bounce: { target: 0 } }], text: '{1}, {T}, Sacrifice Professor Zei: Return target instant or sorcery card from your graveyard to your hand. Activate only during your turn.' },
  ],
});
