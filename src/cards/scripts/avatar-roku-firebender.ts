import { card } from '../script';

// Avatar Roku, Firebender: Whenever a player attacks, add six {R}. Until end of combat, you don't lose this mana as steps end. / {R}{R}{R}: Target creature gets +3/+0 until end of turn.
export default card({
  oracleId: '9eb9e4c1-fabf-45ff-a584-fbe4b94fb41c',
  name: "Avatar Roku, Firebender",
  triggered: [{ when: { attacks: { types: ['Creature'] } }, oneOrMore: true, effects: [{ addMana: ['R'], n: 6, untilEndOfCombat: true }], text: "Whenever a player attacks, add six {R}. Until end of combat, you don't lose this mana as steps end." }],
  activated: [{ cost: { mana: '{R}{R}{R}' }, targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: 3, toughness: 0, duration: 'endOfTurn' }], text: '{R}{R}{R}: Target creature gets +3/+0 until end of turn.' }],
});
