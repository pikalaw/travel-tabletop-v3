import { card } from '../script';

// Sokka's Haiku: Counter target spell. / Draw a card, then mill three cards. / Untap target land.
export default card({
  oracleId: '87a97c72-143d-48a8-a1c5-3c44aa8e5a86',
  name: "Sokka's Haiku",
  spell: {
    targets: [{ objects: { zone: 'stack' } }, { objects: { types: ['Land'] } }],
    effects: [{ counterSpell: { target: 0 } }, { draw: 'you', n: 1 }, { mill: 'you', n: 3 }, { untap: { target: 1 } }],
  },
});
