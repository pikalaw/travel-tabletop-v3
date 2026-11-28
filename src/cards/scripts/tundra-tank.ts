import { crew, firebending } from '../keywords';
import { card } from '../script';

// Tundra Tank: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / When this Vehicle enters, target creature you control gains indestructible until end of turn. / Crew 1 (Tap any number of creatures you control with total power 1 or more: This Vehicle becomes an artifact creature until end of turn.)
export default card({
  oracleId: '2ded4b02-7aa4-46a1-b10f-8480eb942cd4',
  name: "Tundra Tank",
  triggered: [firebending(1), { when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ grant: { target: 0 }, keywords: ['indestructible'], duration: 'endOfTurn' }], text: 'When this Vehicle enters, target creature you control gains indestructible until end of turn.' }],
  activated: [crew(1)],
});
