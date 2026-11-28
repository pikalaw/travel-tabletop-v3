import { card } from '../script';

// Fists of Flame: Draw a card. Until end of turn, target creature gains trample and gets +1/+0 for each card you've drawn this turn. (A creature with trample can deal excess combat damage to the player or planeswalker it's attacking.)
export default card({
  oracleId: 'e05abb6b-e9f4-4d9e-ad1e-7805ebc09914',
  name: "Fists of Flame",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [
      { draw: 'you', n: 1 },
      { grant: { target: 0 }, keywords: ['trample'], duration: 'endOfTurn' },
      { pump: { target: 0 }, power: { thisTurn: 'cardsYouDrew' }, toughness: 0, duration: 'endOfTurn' },
    ],
  },
});
