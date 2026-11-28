import { TOKENS } from '../tokens';
import { card } from '../script';

// Leaves from the Vine: (As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.) / I — Mill three cards, then create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.") / II — Put a +1/+1 counter on each of up to two target creatures you control. / III — Draw a card if there's a creature or Lesson card in your graveyard.
export default card({
  oracleId: '7c4abd72-29b0-4c82-9e67-b481cf7e8775',
  name: "Leaves from the Vine",
  triggered: [
    { when: { lore: true }, chapter: 1, effects: [{ mill: 'you', n: 3 }, { createToken: TOKENS.food, n: 1 }], text: 'I — Mill three cards, then create a Food token.' },
    { when: { lore: true }, chapter: 2, targets: [{ objects: { types: ['Creature'], controller: 'you' }, count: 2, upTo: true }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'II — Put a +1/+1 counter on each of up to two target creatures you control.' },
    { when: { lore: true }, chapter: 3, effects: [{ if: { exists: { anyOf: [{ types: ['Creature'] }, { subtypes: ['Lesson'] }], zone: 'graveyard', controller: 'you' } }, then: [{ draw: 'you', n: 1 }] }], text: "III — Draw a card if there's a creature or Lesson card in your graveyard." },
  ],
});
