import { card } from '../script';

// Master Pakku: Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.) / Whenever Master Pakku becomes tapped, target player mills X cards, where X is the number of Lesson cards in your graveyard. (They put the top X cards of their library into their graveyard.)
export default card({
  oracleId: 'b1727c07-c829-4d64-a1c5-8b53c743888a',
  name: "Master Pakku",
  triggered: [{ when: { becomesTapped: {} }, self: true, targets: [{ players: 'any' }], effects: [{ mill: { target: 0 }, n: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } } }], text: 'Whenever Master Pakku becomes tapped, target player mills X cards, where X is the number of Lesson cards in your graveyard.' }],
});
