import { card } from '../script';

// That's Rough Buddy: Put a +1/+1 counter on target creature. Put two +1/+1 counters on that creature instead if a creature left the battlefield under your control this turn. / Draw a card.
export default card({
  oracleId: 'fc3ee37a-f676-44af-80d0-774ff271ce11',
  name: "That's Rough Buddy",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [{ if: { thisTurn: 'aCreatureLeftForYou' }, then: [{ addCounters: '+1/+1', n: 2, on: { target: 0 } }], else: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }] }, { draw: 'you', n: 1 }],
  },
});
