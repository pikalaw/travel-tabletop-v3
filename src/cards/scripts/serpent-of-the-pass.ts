import { card } from '../script';

// Serpent of the Pass: If there are three or more Lesson cards in your graveyard, you may cast this spell as though it had flash. / This spell costs {1} less to cast for each noncreature, nonland card in your graveyard.
export default card({
  oracleId: '98e36c6e-a868-4679-a5b5-6f02097f560b',
  name: "Serpent of the Pass",
  spell: {
    effects: [],
    flashIf: { atLeast: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, n: 3 },
    reduceBy: { count: { notTypes: ['Creature', 'Land'], zone: 'graveyard', controller: 'you' } },
  },
});
