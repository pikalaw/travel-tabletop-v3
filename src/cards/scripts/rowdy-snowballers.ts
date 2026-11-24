import { card } from '../script';

// Rowdy Snowballers: When this creature enters, tap target creature an opponent controls and put a stun counter on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)
export default card({
  oracleId: '74224cce-c2ce-4456-8a97-3abbbb199385',
  name: "Rowdy Snowballers",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'opponent' } }], effects: [{ tap: { target: 0 } }, { addCounters: 'stun', n: 1, on: { target: 0 } }], text: 'When this creature enters, tap target creature an opponent controls and put a stun counter on it.' }],
});
