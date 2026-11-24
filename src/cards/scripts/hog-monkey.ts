import { card } from '../script';

// Hog-Monkey: At the beginning of combat on your turn, target creature you control with a +1/+1 counter on it gains menace until end of turn. (It can't be blocked except by two or more creatures.) / Exhaust — {5}: Put two +1/+1 counters on this creature. (Activate each exhaust ability only once.)
export default card({
  oracleId: 'e11591ee-7074-488e-8d2f-f8c89e385a55',
  name: "Hog-Monkey",
  triggered: [{ when: { step: 'beginCombat', whose: 'yours' }, targets: [{ objects: { types: ['Creature'], controller: 'you', withCounter: '+1/+1' } }], effects: [{ grant: { target: 0 }, keywords: ['menace'], duration: 'endOfTurn' }], text: 'At the beginning of combat on your turn, target creature you control with a +1/+1 counter on it gains menace until end of turn.' }],
  activated: [{ cost: { mana: '{5}' }, exhaust: true, effects: [{ addCounters: '+1/+1', n: 2, on: 'self' }], text: 'Exhaust — {5}: Put two +1/+1 counters on this creature.' }],
});
