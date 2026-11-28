import { card } from '../script';

// Cycle of Renewal: Sacrifice a land. Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.
export default card({
  oracleId: '77eda626-5cef-496d-b291-cfa1ee6fc1fb',
  name: "Cycle of Renewal",
  spell: { effects: [
    { choose: { types: ['Land'], controller: 'you' }, n: 1, text: 'Sacrifice a land', then: [{ sacrifice: 'chosen' }] },
    { search: { types: ['Land'], supertypes: ['Basic'] }, n: 2, to: 'battlefield', tapped: true },
  ] },
});
