import { card } from '../script';

// Crashing Wave: As an additional cost to cast this spell, waterbend {X}. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.) / Tap up to X target creatures, then distribute three stun counters among any number of tapped creatures your opponents control. (If a permanent with a stun counter would become untapped, remove one from it instead.)
export default card({
  oracleId: 'c8d3936f-4c08-4ffe-83c9-7ed26fb8f9cd',
  name: "Crashing Wave",
  spell: {
    additionalCost: { waterbend: 'x' },
    targets: [{ objects: { types: ['Creature'] }, count: 'x', upTo: true }],
    effects: [{ tap: { target: 0 } }, { distributeCounters: 'stun', n: 3, among: { types: ['Creature'], tapped: true, controller: 'opponent' } }],
  },
});
