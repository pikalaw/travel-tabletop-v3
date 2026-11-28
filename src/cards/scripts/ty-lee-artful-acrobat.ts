import { card } from '../script';

// Ty Lee, Artful Acrobat: Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.) / Whenever Ty Lee attacks, you may pay {1}. When you do, target creature can't block this turn.
export default card({
  oracleId: '3726b9a0-67cb-4f45-ab50-62db50f93568',
  name: "Ty Lee, Artful Acrobat",
  triggered: [{
    when: { attacks: {} }, self: true,
    effects: [{ mayPay: '{1}', then: [{ reflexive: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ grant: { target: 0 }, keywords: ["can't block"], duration: 'endOfTurn' }], text: "When you do, target creature can't block this turn." } }], text: "target creature can't block this turn" }],
    text: "Whenever Ty Lee attacks, you may pay {1}. When you do, target creature can't block this turn.",
  }],
});
