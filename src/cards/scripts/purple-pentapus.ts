import { card } from '../script';

// Purple Pentapus: When this creature enters, surveil 1. (Look at the top card of your library. You may put it into your graveyard.) / {2}{B}, Tap an untapped creature you control: Return this card from your graveyard to the battlefield tapped.
export default card({
  oracleId: '37d2e83d-f5fd-48d2-b091-3c9167522530',
  name: "Purple Pentapus",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ surveil: 1 }], text: 'When this creature enters, surveil 1.' }],
  activated: [{
    cost: { mana: '{2}{B}', tapAnother: {} }, zone: 'graveyard',
    effects: [{ returnToBattlefield: 'self', tapped: true }],
    text: '{2}{B}, Tap an untapped creature you control: Return this card from your graveyard to the battlefield tapped.',
  }],
});
