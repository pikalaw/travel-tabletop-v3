import { firebending } from '../keywords';
import { card } from '../script';

// Zhao, Ruthless Admiral: Firebending 2 (Whenever this creature attacks, add {R}{R}. This mana lasts until end of combat.) / Whenever you sacrifice another permanent, creatures you control get +1/+0 until end of turn.
export default card({
  oracleId: 'd6b0198a-c1f2-4142-b5e2-8205adf14d0a',
  name: "Zhao, Ruthless Admiral",
  triggered: [firebending(2), { when: { sacrificed: { other: true } }, effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: 1, toughness: 0, duration: 'endOfTurn' }], text: 'Whenever you sacrifice another permanent, creatures you control get +1/+0 until end of turn.' }],
});
