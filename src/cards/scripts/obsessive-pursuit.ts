import { TOKENS } from '../tokens';
import { card } from '../script';

// Obsessive Pursuit: When this enchantment enters and at the beginning of your upkeep, you lose 1 life and create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.") / Whenever you attack, put X +1/+1 counters on target attacking creature, where X is the number of permanents you've sacrificed this turn. If X is three or more, that creature gains lifelink until end of turn.
export default card({
  oracleId: '7e7abb44-47b0-4d80-b8a1-36f0c1032aa3',
  name: "Obsessive Pursuit",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ loseLife: 'you', n: 1 }, { createToken: TOKENS.clue, n: 1 }], text: 'When this enchantment enters, you lose 1 life and create a Clue token.' },
    { when: { step: 'upkeep', whose: 'yours' }, effects: [{ loseLife: 'you', n: 1 }, { createToken: TOKENS.clue, n: 1 }], text: 'At the beginning of your upkeep, you lose 1 life and create a Clue token.' },
    {
      when: { attacks: { controller: 'you' } }, oneOrMore: true, targets: [{ objects: { types: ['Creature'], attacking: true } }],
      effects: [{ addCounters: '+1/+1', n: { thisTurn: 'youSacrificed' }, on: { target: 0 } }, { if: { atLeast: { thisTurn: 'youSacrificed' }, n: 3 }, then: [{ grant: { target: 0 }, keywords: ['lifelink'], duration: 'endOfTurn' }] }],
      text: "Whenever you attack, put X +1/+1 counters on target attacking creature, where X is the number of permanents you've sacrificed this turn. If X is three or more, that creature gains lifelink until end of turn.",
    },
  ],
});
