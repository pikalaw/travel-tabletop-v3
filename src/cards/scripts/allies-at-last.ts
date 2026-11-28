import { card } from '../script';

// Allies at Last: Affinity for Allies (This spell costs {1} less to cast for each Ally you control.) / Up to two target creatures you control each deal damage equal to their power to target creature an opponent controls.
export default card({
  oracleId: 'c15e5e93-2eff-407d-ae75-437e36ef85ba',
  name: "Allies at Last",
  spell: {
    reduceBy: { count: { subtypes: ['Ally'], controller: 'you' } },
    targets: [{ objects: { types: ['Creature'], controller: 'you' }, count: 2, upTo: true }, { objects: { types: ['Creature'], controller: 'opponent' } }],
    effects: [{ eachDeals: { target: 0 }, to: { target: 1 } }],
  },
});
