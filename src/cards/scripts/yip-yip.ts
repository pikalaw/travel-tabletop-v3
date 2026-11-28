import { card } from '../script';

// Yip Yip!: Target creature you control gets +2/+2 until end of turn. If that creature is an Ally, it also gains flying until end of turn.
export default card({
  oracleId: '5453550f-9136-4568-baf8-c3d20e33fbb6',
  name: "Yip Yip!",
  spell: {
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
    effects: [{ pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }, { if: { target: 0, is: { subtypes: ['Ally'] } }, then: [{ grant: { target: 0 }, keywords: ['flying'], duration: 'endOfTurn' }] }],
  },
});
