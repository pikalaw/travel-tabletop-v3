import { card } from '../script';

// Team Avatar: Whenever a creature you control attacks alone, it gets +X/+X until end of turn, where X is the number of creatures you control. / {2}{W}, Discard this card: It deals damage equal to the number of creatures you control to target creature.
export default card({
  oracleId: 'f95f7b0c-2dd6-46e1-ae02-f51d275e7120',
  name: "Team Avatar",
  triggered: [{
    when: { attacks: { types: ['Creature'], controller: 'you' } }, onlyIf: { atLeast: { count: { types: ['Creature'], attacking: true, controller: 'you' } }, n: 1 },
    if: { not: { atLeast: { count: { types: ['Creature'], attacking: true, controller: 'you' } }, n: 2 } },
    effects: [{ pump: 'triggerObject', power: { count: { types: ['Creature'], controller: 'you' } }, toughness: { count: { types: ['Creature'], controller: 'you' } }, duration: 'endOfTurn' }],
    text: 'Whenever a creature you control attacks alone, it gets +X/+X until end of turn, where X is the number of creatures you control.',
  }],
  activated: [{ cost: { mana: '{2}{W}', discardSelf: true }, zone: 'hand', targets: [{ objects: { types: ['Creature'] } }], effects: [{ damage: { count: { types: ['Creature'], controller: 'you' } }, to: { target: 0 } }], text: '{2}{W}, Discard this card: It deals damage equal to the number of creatures you control to target creature.' }],
});
