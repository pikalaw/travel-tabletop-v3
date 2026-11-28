import { card } from '../script';

// Accumulate Wisdom: Look at the top three cards of your library. Put one of those cards into your hand and the rest on the bottom of your library in any order. Put each of those cards into your hand instead if there are three or more Lesson cards in your graveyard.
export default card({
  oracleId: 'a63eb744-71c4-447d-9372-c3a734f022c5',
  name: "Accumulate Wisdom",
  spell: { effects: [{
    if: { atLeast: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, n: 3 },
    then: [{ lookAtTop: 3, mayTake: {}, rest: 'bottom', all: true }],
    else: [{ lookAtTop: 3, mayTake: {}, rest: 'bottom', mustTake: true }],
  }] },
});
