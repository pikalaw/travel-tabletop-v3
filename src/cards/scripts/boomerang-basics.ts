import { card } from '../script';

// Boomerang Basics: Return target nonland permanent to its owner's hand. If you controlled that permanent, draw a card.
export default card({
  oracleId: 'acd881eb-f3b4-4174-9fc2-e3c7c213886b',
  name: "Boomerang Basics",
  spell: {
    targets: [{ objects: { notTypes: ['Land'] } }],
    effects: [{ if: { target: 0, is: { controller: 'you' } }, then: [{ bounce: { target: 0 } }, { draw: 'you', n: 1 }], else: [{ bounce: { target: 0 } }] }],
  },
});
