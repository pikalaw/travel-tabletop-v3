import { card } from '../script';

// Deadly Precision: As an additional cost to cast this spell, pay {4} or sacrifice an artifact or creature. / Destroy target creature.
export default card({
  oracleId: 'd23ca3d2-0731-4df4-a3c6-69ddf0c58601',
  name: "Deadly Precision",
  spell: {
    costOptions: [{ cost: { mana: '{4}' }, text: 'Pay {4}' }, { cost: { sacrifice: { types: ['Artifact', 'Creature'] } }, text: 'Sacrifice an artifact or creature' }],
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [{ destroy: { target: 0 } }],
  },
});
