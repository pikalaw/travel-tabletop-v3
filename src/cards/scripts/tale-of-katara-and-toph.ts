import { card } from '../script';

// Tale of Katara and Toph: Creatures you control have "Whenever this creature becomes tapped for the first time during each of your turns, put a +1/+1 counter on it."
export default card({
  oracleId: '7c376ea9-d50a-4cc3-ae40-7bac3a926f20',
  name: "Tale of Katara and Toph",
  // The granted trigger, as the enchantment's own: the same events, the same result.
  triggered: [{
    when: { becomesTapped: { types: ['Creature'], controller: 'you' } }, if: { all: ['yourTurn', 'firstTapThisTurn'] },
    effects: [{ addCounters: '+1/+1', n: 1, on: 'triggerObject' }],
    text: 'Whenever a creature you control becomes tapped for the first time during each of your turns, put a +1/+1 counter on it.',
  }],
});
