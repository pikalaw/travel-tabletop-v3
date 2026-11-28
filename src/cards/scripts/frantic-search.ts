import { card } from '../script';

// Frantic Search: Draw two cards, then discard two cards. Untap up to three lands.
export default card({
  oracleId: '16e015b2-f8a3-4b1a-80be-58a8f5fb5e8c',
  name: "Frantic Search",
  spell: { effects: [
    { draw: 'you', n: 2 }, { discard: 'you', n: 2 },
    { choose: { types: ['Land'], tapped: true }, n: 3, upTo: true, text: 'Untap up to three lands', then: [{ untap: 'chosen' }] },
  ] },
});
