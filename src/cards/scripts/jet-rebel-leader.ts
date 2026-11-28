import { card } from '../script';

// Jet, Rebel Leader: Whenever Jet attacks, look at the top five cards of your library. You may put a creature card with mana value 3 or less from among them onto the battlefield tapped and attacking. Put the rest on the bottom of your library in a random order.
export default card({
  oracleId: 'b9ca8ead-c267-4170-a6c8-04498330c82b',
  name: "Jet, Rebel Leader",
  triggered: [{ when: { attacks: {} }, self: true, effects: [{ lookAtTop: 5, mayTake: { types: ['Creature'], manaValue: { op: '<=', n: 3 } }, rest: 'bottomRandom', attacking: true }], text: 'Whenever Jet attacks, look at the top five cards of your library. You may put a creature card with mana value 3 or less from among them onto the battlefield tapped and attacking. Put the rest on the bottom of your library in a random order.' }],
});
