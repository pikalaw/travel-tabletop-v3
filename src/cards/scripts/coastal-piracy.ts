import { card } from '../script';

// Coastal Piracy: Whenever a creature you control deals combat damage to an opponent, you may draw a card.
export default card({
  oracleId: '8a05ec32-7b0c-4f23-a4f7-413301c2a70a',
  name: "Coastal Piracy",
  triggered: [{ when: { dealsCombatDamageToPlayer: { types: ['Creature'], controller: 'you' } }, effects: [{ may: [{ draw: 'you', n: 1 }], text: 'draw a card' }], text: 'Whenever a creature you control deals combat damage to an opponent, you may draw a card.' }],
});
