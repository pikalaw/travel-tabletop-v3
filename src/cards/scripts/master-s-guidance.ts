import { card } from '../script';

// Master's Guidance: Whenever you attack with two or more legendary creatures, put a +1/+1 counter on each of up to two target attacking creatures. / At the beginning of your end step, if you control a creature with power 4 or greater, draw a card.
export default card({
  oracleId: '66de5b97-0de0-422c-a351-bfe55ad4503a',
  name: "Master's Guidance",
  triggered: [
    {
      when: { attacks: { supertypes: ['Legendary'], controller: 'you' } }, oneOrMore: true,
      onlyIf: { atLeast: { count: { supertypes: ['Legendary'], types: ['Creature'], attacking: true, controller: 'you' } }, n: 2 },
      targets: [{ objects: { types: ['Creature'], attacking: true }, count: 2, upTo: true }],
      effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }],
      text: 'Whenever you attack with two or more legendary creatures, put a +1/+1 counter on each of up to two target attacking creatures.',
    },
    { when: { step: 'end', whose: 'yours' }, if: { exists: { types: ['Creature'], controller: 'you', power: { op: '>=', n: 4 } } }, effects: [{ draw: 'you', n: 1 }], text: 'At the beginning of your end step, if you control a creature with power 4 or greater, draw a card.' },
  ],
});
