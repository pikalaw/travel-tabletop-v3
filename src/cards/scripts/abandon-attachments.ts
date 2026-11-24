import { card } from '../script';

// Abandon Attachments: You may discard a card. If you do, draw two cards.
export default card({
  oracleId: '82333385-631f-4abf-b159-bb367f1c6fd9',
  name: "Abandon Attachments",
  spell: { effects: [{ optional: { discard: 1 }, then: [{ draw: 'you', n: 2 }] }] },
});
