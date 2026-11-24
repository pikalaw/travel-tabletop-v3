import { card } from '../script';

// Water Whip: As an additional cost to cast this spell, waterbend {5}. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.) / Return up to two target creatures to their owners' hands. Draw two cards.
export default card({
  oracleId: '2015f455-988e-444c-93df-23fab179ef87',
  name: "Water Whip",
  spell: {
    additionalCost: { waterbend: 5 },
    targets: [{ objects: { types: ['Creature'] }, count: 2, upTo: true }],
    effects: [{ bounce: { target: 0 } }, { draw: 'you', n: 2 }],
  },
});
