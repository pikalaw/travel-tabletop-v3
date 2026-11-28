import { card } from '../script';

// Dutiful Knowledge Seeker: Whenever one or more cards are put into a library from anywhere, put a +1/+1 counter on this creature. / {3}: Put target card from a graveyard on the bottom of its owner's library.
export default card({
  oracleId: 'b58a70e2-3609-441a-993a-dccb9a2cf242',
  name: "Dutiful Knowledge Seeker",
  triggered: [{ when: { toLibrary: true }, oneOrMore: true, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever one or more cards are put into a library from anywhere, put a +1/+1 counter on this creature.' }],
  activated: [{ cost: { mana: '{3}' }, targets: [{ objects: { zone: 'graveyard' } }], effects: [{ toOwnersLibrary: { target: 0 }, places: ['bottom'] }], text: "{3}: Put target card from a graveyard on the bottom of its owner's library." }],
});
