import { card } from '../script';

// Firebending Lesson: Kicker {4} (You may pay an additional {4} as you cast this spell.) / Firebending Lesson deals 2 damage to target creature. If this spell was kicked, it deals 5 damage to that creature instead.
export default card({
  oracleId: 'a9282f91-638e-414b-8b3d-9a99e30aec96',
  name: "Firebending Lesson",
  spell: {
    costOptions: [{ cost: {}, text: 'Not kicked' }, { cost: { mana: '{4}' }, text: 'Kicker {4}' }],
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [{ if: { costPaid: 1 }, then: [{ damage: 5, to: { target: 0 } }], else: [{ damage: 2, to: { target: 0 } }] }],
  },
});
