import { card } from '../script';

// Rocky Rebuke: Target creature you control deals damage equal to its power to target creature an opponent controls.
export default card({
  oracleId: 'fd85db70-8616-42df-9dac-bad7923f88d7',
  name: "Rocky Rebuke",
  spell: {
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }, { objects: { types: ['Creature'], controller: 'opponent' } }],
    effects: [{ damage: { powerOf: { target: 0 } }, to: { target: 1 }, from: { target: 0 } }],
  },
});
