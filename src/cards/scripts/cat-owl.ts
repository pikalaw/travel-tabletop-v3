import { card } from '../script';

// Cat-Owl: Flying / Whenever this creature attacks, untap target artifact or creature.
export default card({
  oracleId: 'ba6840a6-b6fd-4b91-ac1a-a61b7b15849a',
  name: "Cat-Owl",
  triggered: [{ when: { attacks: {} }, self: true, targets: [{ objects: { anyOf: [{ types: ['Artifact'] }, { types: ['Creature'] }] } }], effects: [{ untap: { target: 0 } }], text: 'Whenever this creature attacks, untap target artifact or creature.' }],
});
