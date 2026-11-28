import { TOKENS } from '../tokens';
import { card } from '../script';

// Founding of Omashu: (As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.) / I — Create two 1/1 white Ally creature tokens. / II — You may discard a card. If you do, draw a card. / III — Creatures you control get +1/+0 until end of turn.
export default card({
  oracleId: 'ea58fb10-3d70-4c25-b317-615dfb20a48d',
  name: "Founding of Omashu",
  triggered: [
    { when: { lore: true }, chapter: 1, effects: [{ createToken: TOKENS.ally, n: 2 }], text: 'I — Create two 1/1 white Ally creature tokens.' },
    { when: { lore: true }, chapter: 2, effects: [{ optional: { discard: 1 }, then: [{ draw: 'you', n: 1 }] }], text: 'II — You may discard a card. If you do, draw a card.' },
    { when: { lore: true }, chapter: 3, effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: 1, toughness: 0, duration: 'endOfTurn' }], text: 'III — Creatures you control get +1/+0 until end of turn.' },
  ],
});
