import { card } from '../script';

// Shared Roots: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.
export default card({
  oracleId: '9e0fd3bf-f47a-4f06-8ff1-73f6bf5d1e03',
  name: "Shared Roots",
  spell: { effects: [{ search: { types: ['Land'], supertypes: ['Basic'] }, to: 'battlefield', tapped: true }] },
});
