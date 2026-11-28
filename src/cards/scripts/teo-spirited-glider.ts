import { card } from '../script';

// Teo, Spirited Glider: Flying / Whenever one or more creatures you control with flying attack, draw a card, then discard a card. When you discard a nonland card this way, put a +1/+1 counter on target creature you control.
export default card({
  oracleId: 'ea74940f-01de-4804-92ed-b273fddf6d62',
  name: "Teo, Spirited Glider",
  triggered: [{
    when: { attacks: { keyword: 'flying', controller: 'you' } }, oneOrMore: true,
    effects: [
      { draw: 'you', n: 1 }, { discard: 'you', n: 1 },
      { provided: { discarded: { notTypes: ['Land'] } }, reflexive: { targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'When you discard a nonland card this way, put a +1/+1 counter on target creature you control.' } },
    ],
    text: 'Whenever one or more creatures you control with flying attack, draw a card, then discard a card.',
  }],
});
