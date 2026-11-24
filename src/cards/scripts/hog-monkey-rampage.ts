import { card } from '../script';

// Hog-Monkey Rampage: Choose target creature you control and target creature an opponent controls. Put a +1/+1 counter on the creature you control if it has power 4 or greater. Then those creatures fight each other. (Each deals damage equal to its power to the other.)
export default card({
  oracleId: '9e5df175-5f91-47f7-957c-63bac31f0858',
  name: "Hog-Monkey Rampage",
  spell: {
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }, { objects: { types: ['Creature'], controller: 'opponent' } }],
    effects: [{ if: { target: 0, is: { power: { op: '>=', n: 4 } } }, then: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }] }, { fight: [{ target: 0 }, { target: 1 }] }],
  },
});
