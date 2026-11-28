import { card } from '../script';

// Combustion Man: Whenever Combustion Man attacks, destroy target permanent unless its controller has Combustion Man deal damage to them equal to his power.
export default card({
  oracleId: '533b107c-fd66-45ef-b74e-e6bd9b75ea8f',
  name: "Combustion Man",
  triggered: [{
    when: { attacks: {} }, self: true, targets: [{ objects: {} }],
    effects: [{
      may: [{ damage: { powerOf: 'self' }, to: { controllerOf: { target: 0 } } }],
      else: [{ destroy: { target: 0 } }],
      by: { controllerOf: { target: 0 } },
      text: 'have Combustion Man deal damage to you equal to his power (if not, the permanent is destroyed)',
    }],
    text: 'Whenever Combustion Man attacks, destroy target permanent unless its controller has Combustion Man deal damage to them equal to his power.',
  }],
});
