import { card } from '../script';

// Sparring Dummy: Defender / {T}: Mill a card. You may put a land card milled this way into your hand. You gain 2 life if a Lesson card is milled this way. (To mill a card, put the top card of your library into your graveyard.)
export default card({
  oracleId: '036b7b89-e49a-4560-9de9-1d4d71f3f666',
  name: "Sparring Dummy",
  activated: [{
    cost: { tap: true },
    effects: [
      { mill: 'you', n: 1 },
      { if: { chosen: { subtypes: ['Lesson'] } }, then: [{ gainLife: 'you', n: 2 }] },
      { if: { chosen: { types: ['Land'] } }, then: [{ may: [{ bounce: 'chosen' }], text: 'put the milled land card into your hand' }] },
    ],
    text: '{T}: Mill a card. You may put a land card milled this way into your hand. You gain 2 life if a Lesson card is milled this way.',
  }],
});
