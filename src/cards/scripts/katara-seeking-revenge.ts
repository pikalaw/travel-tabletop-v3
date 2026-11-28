import { card } from '../script';

// Katara, Seeking Revenge: As an additional cost to cast this spell, you may waterbend {2}. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.) / When Katara enters, draw a card, then discard a card unless her additional cost was paid. / Katara gets +1/+1 for each Lesson card in your graveyard.
export default card({
  oracleId: '124cc815-0877-40f2-98c8-e7c4f8cd6598',
  name: "Katara, Seeking Revenge",
  spell: { effects: [], costOptions: [{ cost: {}, text: "Don't waterbend" }, { cost: { waterbend: 2 }, text: 'Waterbend {2}' }] },
  triggered: [{ when: { enters: {} }, self: true, effects: [{ draw: 'you', n: 1 }, { if: { not: { costPaid: 1 } }, then: [{ discard: 'you', n: 1 }] }], text: 'When Katara enters, draw a card, then discard a card unless her additional cost was paid.' }],
  statics: [{ effect: { affects: 'self', modify: [{ count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }] }, text: 'Katara gets +1/+1 for each Lesson card in your graveyard.' }],
});
