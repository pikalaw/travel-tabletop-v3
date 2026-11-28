import { card } from '../script';

// Brainstorm: Draw three cards, then put two cards from your hand on top of your library in any order.
export default card({
  oracleId: '36cd2364-d113-47d1-b2c4-b088d9eb88dd',
  name: "Brainstorm",
  spell: { effects: [
    { draw: 'you', n: 3 },
    { choose: { zone: 'hand', controller: 'you' }, n: 2, text: 'Put two cards from your hand on top of your library (the first you choose goes on top)', then: [{ toLibraryTop: 'chosen' }] },
  ] },
});
