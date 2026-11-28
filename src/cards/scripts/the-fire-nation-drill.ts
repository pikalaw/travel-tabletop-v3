import { crew } from '../keywords';
import { card } from '../script';

// The Fire Nation Drill: Trample / When The Fire Nation Drill enters, you may tap it. When you do, destroy target creature with power 4 or less. / {1}: Permanents your opponents control lose hexproof and indestructible until end of turn. / Crew 2
export default card({
  oracleId: '3d4b9d71-4275-4c18-a4dc-9aad234eb92c',
  name: "The Fire Nation Drill",
  triggered: [{
    when: { enters: {} }, self: true,
    effects: [{ may: [{ tap: 'self' }, { reflexive: { targets: [{ objects: { types: ['Creature'], power: { op: '<=', n: 4 } } }], effects: [{ destroy: { target: 0 } }], text: 'When you do, destroy target creature with power 4 or less.' } }], text: 'tap The Fire Nation Drill (then destroy target creature with power 4 or less)' }],
    text: 'When The Fire Nation Drill enters, you may tap it. When you do, destroy target creature with power 4 or less.',
  }],
  activated: [
    { cost: { mana: '{1}' }, effects: [{ continuous: { removeKeywords: ['hexproof', 'indestructible'] }, on: { all: { controller: 'opponent' } }, duration: 'endOfTurn' }], text: '{1}: Permanents your opponents control lose hexproof and indestructible until end of turn.' },
    crew(2),
  ],
});
