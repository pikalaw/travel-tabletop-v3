import { card } from '../script';

// Waterbender's Restoration: As an additional cost to cast this spell, waterbend {X}. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.) / Exile X target creatures you control. Return those cards to the battlefield under their owner's control at the beginning of the next end step.
export default card({
  oracleId: '285046f6-b3c4-4eb7-8712-9dffebabc762',
  name: "Waterbender's Restoration",
  spell: {
    additionalCost: { waterbend: 'x' },
    targets: [{ objects: { types: ['Creature'], controller: 'you' }, count: 'x' }],
    effects: [{ exileReturns: { target: 0 } }],
  },
});
