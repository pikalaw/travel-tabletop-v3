import { card } from '../script';

// Ozai's Cruelty: Ozai's Cruelty deals 2 damage to target player. That player discards two cards.
export default card({
  oracleId: 'aba5c046-2f8c-4749-b347-9a7d8cb1c865',
  name: "Ozai's Cruelty",
  spell: { targets: [{ players: 'any' }], effects: [{ damage: 2, to: { target: 0 } }, { discard: { target: 0 }, n: 2 }] },
});
