import { card } from '../script';

// Momo, Rambunctious Rascal: Flying (This creature can't be blocked except by creatures with flying or reach.) / When Momo enters, he deals 4 damage to target tapped creature an opponent controls.
export default card({
  oracleId: '8854222e-590f-4fc0-b5d7-bf3d986b8507',
  name: "Momo, Rambunctious Rascal",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], tapped: true, controller: 'opponent' } }], effects: [{ damage: 4, to: { target: 0 } }], text: 'When Momo enters, he deals 4 damage to target tapped creature an opponent controls.' }],
});
