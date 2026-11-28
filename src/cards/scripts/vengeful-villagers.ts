import { card } from '../script';

// Vengeful Villagers: Whenever this creature attacks, choose target creature an opponent controls. Tap it, then you may sacrifice an artifact or creature. If you do, put a stun counter on the chosen creature. (If a permanent with a stun counter would become untapped, remove one from it instead.)
export default card({
  oracleId: 'ad6442c2-7aa2-4c24-8133-f679a3499bde',
  name: "Vengeful Villagers",
  triggered: [{
    when: { attacks: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'opponent' } }],
    effects: [{ tap: { target: 0 } }, { optional: { sacrifice: { types: ['Artifact', 'Creature'] } }, then: [{ addCounters: 'stun', n: 1, on: { target: 0 } }] }],
    text: 'Whenever this creature attacks, choose target creature an opponent controls. Tap it, then you may sacrifice an artifact or creature. If you do, put a stun counter on the chosen creature.',
  }],
});
