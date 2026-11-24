import { card } from '../script';

// Epic Downfall: Exile target creature with mana value 3 or greater.
export default card({
  oracleId: 'ed5d6aba-0b8d-48b3-a84c-618f45fb67b1',
  name: "Epic Downfall",
  spell: { targets: [{ objects: { types: ['Creature'], manaValue: { op: '>=', n: 3 } } }], effects: [{ exile: { target: 0 } }] },
});
