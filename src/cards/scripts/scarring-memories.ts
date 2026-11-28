import { card } from '../script';

// Scarring Memories: You may cast this spell as though it had flash if you control an attacking legendary creature. / Target opponent sacrifices a creature of their choice, discards a card, and loses 3 life.
export default card({
  oracleId: '63957ec0-89e6-4be2-8740-846ca56ee48c',
  name: "Scarring Memories",
  spell: {
    flashIf: { exists: { supertypes: ['Legendary'], types: ['Creature'], attacking: true, controller: 'you' } },
    targets: [{ players: 'opponent' }],
    effects: [
      { choose: { types: ['Creature'], controller: 'you' }, n: 1, by: { target: 0 }, text: 'Sacrifice a creature', then: [{ sacrifice: 'chosen' }] },
      { discard: { target: 0 }, n: 1 },
      { loseLife: { target: 0 }, n: 3 },
    ],
  },
});
