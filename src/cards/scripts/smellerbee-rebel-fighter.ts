import { card } from '../script';

// Smellerbee, Rebel Fighter: First strike / Other creatures you control have haste. / Whenever Smellerbee attacks, you may discard your hand. If you do, draw cards equal to the number of attacking creatures.
export default card({
  oracleId: '127bc05b-2945-434c-bc6a-283a267cc72a',
  name: "Smellerbee, Rebel Fighter",
  statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you', other: true } }, addKeywords: ['haste'] }, text: 'Other creatures you control have haste.' }],
  triggered: [{
    when: { attacks: {} }, self: true,
    effects: [{ may: [{ discardHandDraw: 'you', drawing: { count: { types: ['Creature'], attacking: true } } }], text: 'discard your hand and draw cards equal to the number of attacking creatures' }],
    text: 'Whenever Smellerbee attacks, you may discard your hand. If you do, draw cards equal to the number of attacking creatures.',
  }],
});
