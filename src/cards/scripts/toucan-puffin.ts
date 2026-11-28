import { card } from '../script';

// Toucan-Puffin: Flying / When this creature enters, target creature you control gets +2/+0 until end of turn.
export default card({
  oracleId: '39d283e0-9d9b-4c04-aa6a-66a9883af9a2',
  name: "Toucan-Puffin",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ pump: { target: 0 }, power: 2, toughness: 0, duration: 'endOfTurn' }], text: 'When this creature enters, target creature you control gets +2/+0 until end of turn.' }],
});
