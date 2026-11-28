import { card } from '../script';

// Bison Whistle: {1}, {T}: Look at the top card of your library. If it's a Bison card, you may put it onto the battlefield. If it's a creature card, you may reveal it and put it into your hand. Otherwise, you may put it into your graveyard.
export default card({
  oracleId: '47e77918-13ec-47ce-9256-5a3b5bf8d315',
  name: "Bison Whistle",
  activated: [{
    cost: { mana: '{1}', tap: true },
    effects: [{ topCard: [
      { is: { subtypes: ['Bison'] }, to: 'battlefield', text: 'Put it onto the battlefield' },
      { is: { types: ['Creature'] }, to: 'hand', text: 'Reveal it and put it into your hand' },
      { is: { notTypes: ['Creature'] }, to: 'graveyard', text: 'Put it into your graveyard' },
    ], stay: 'top' }],
    text: "{1}, {T}: Look at the top card of your library. If it's a Bison card, you may put it onto the battlefield. If it's a creature card, you may reveal it and put it into your hand. Otherwise, you may put it into your graveyard.",
  }],
});
