import { card } from '../script';

// Chakra Meditation: When this enchantment enters, return up to one target instant or sorcery card from your graveyard to your hand. / Whenever you cast an instant or sorcery spell, draw a card. Then discard a card unless there are three or more Lesson cards in your graveyard.
export default card({
  oracleId: '12c57ebe-35a7-4cb3-936b-99c148a3cfed',
  name: "Chakra Meditation",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { types: ['Instant', 'Sorcery'], zone: 'graveyard', controller: 'you' }, upTo: true }], effects: [{ bounce: { target: 0 } }], text: 'When this enchantment enters, return up to one target instant or sorcery card from your graveyard to your hand.' },
    {
      when: { cast: { types: ['Instant', 'Sorcery'] }, by: 'you' },
      effects: [{ draw: 'you', n: 1 }, { if: { not: { atLeast: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, n: 3 } }, then: [{ discard: 'you', n: 1 }] }],
      text: 'Whenever you cast an instant or sorcery spell, draw a card. Then discard a card unless there are three or more Lesson cards in your graveyard.',
    },
  ],
});
