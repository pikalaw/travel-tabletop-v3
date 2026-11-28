import { card } from '../script';

// Gran-Gran: Whenever Gran-Gran becomes tapped, draw a card, then discard a card. / Noncreature spells you cast cost {1} less to cast as long as there are three or more Lesson cards in your graveyard.
export default card({
  oracleId: '0259a9ed-0558-4183-b737-871ed5573c32',
  name: "Gran-Gran",
  triggered: [{ when: { becomesTapped: {} }, self: true, effects: [{ draw: 'you', n: 1 }, { discard: 'you', n: 1 }], text: 'Whenever Gran-Gran becomes tapped, draw a card, then discard a card.' }],
  statics: [{
    effect: { affects: 'self', reducesCost: { spells: { notTypes: ['Creature'] }, by: 1 } },
    while: { atLeast: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, n: 3 },
    text: 'Noncreature spells you cast cost {1} less to cast as long as there are three or more Lesson cards in your graveyard.',
  }],
});
