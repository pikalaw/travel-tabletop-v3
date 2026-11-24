import { card } from '../script';

// Deny Entry: Counter target creature spell. Draw a card, then discard a card.
export default card({
  oracleId: 'a7dad8fe-b0b8-4c6d-ad11-76b402952799',
  name: "Deny Entry",
  spell: { targets: [{ objects: { types: ['Creature'], zone: 'stack' } }], effects: [{ counterSpell: { target: 0 } }, { draw: 'you', n: 1 }, { discard: 'you', n: 1 }] },
});
