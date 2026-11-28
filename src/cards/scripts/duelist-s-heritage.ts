import { card } from '../script';

// Duelist's Heritage: Whenever one or more creatures attack, you may have target attacking creature gain double strike until end of turn.
export default card({
  oracleId: '5cdc4654-b8c5-4599-a1d2-9e9d5f6509cb',
  name: "Duelist's Heritage",
  triggered: [{ when: { attacks: { types: ['Creature'] } }, oneOrMore: true, targets: [{ objects: { types: ['Creature'], attacking: true } }], effects: [{ may: [{ grant: { target: 0 }, keywords: ['double strike'], duration: 'endOfTurn' }], text: 'have target attacking creature gain double strike until end of turn' }], text: 'Whenever one or more creatures attack, you may have target attacking creature gain double strike until end of turn.' }],
});
