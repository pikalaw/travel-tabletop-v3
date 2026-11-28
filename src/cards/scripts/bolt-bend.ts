import { card } from '../script';

// Bolt Bend: This spell costs {3} less to cast if you control a creature with power 4 or greater. / Change the target of target spell or ability with a single target.
export default card({
  oracleId: 'c20a96f7-aa5a-4c15-b8b1-806685c99b27',
  name: "Bolt Bend",
  spell: {
    reduceBy: { when: { exists: { types: ['Creature'], controller: 'you', power: { op: '>=', n: 4 } } }, n: 3 },
    targets: [{ objects: { zone: 'stack', singleTarget: true } }],
    effects: [{ changeTarget: { target: 0 } }],
  },
});
