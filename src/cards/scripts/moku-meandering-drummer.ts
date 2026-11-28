import { card } from '../script';

// Moku, Meandering Drummer: Whenever you cast a noncreature spell, you may pay {1}. If you do, Moku gets +2/+1 and creatures you control gain haste until end of turn.
export default card({
  oracleId: 'd6e1b1ff-e4e5-4814-9a20-2d527014463f',
  name: "Moku, Meandering Drummer",
  triggered: [{
    when: { cast: { notTypes: ['Creature'] }, by: 'you' },
    effects: [{ mayPay: '{1}', then: [{ pump: 'self', power: 2, toughness: 1, duration: 'endOfTurn' }, { grant: { all: { types: ['Creature'], controller: 'you' } }, keywords: ['haste'], duration: 'endOfTurn' }], text: 'Moku gets +2/+1 and creatures you control gain haste until end of turn' }],
    text: 'Whenever you cast a noncreature spell, you may pay {1}. If you do, Moku gets +2/+1 and creatures you control gain haste until end of turn.',
  }],
});
