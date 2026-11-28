import { card } from '../script';

// Origin of Metalbending: Choose one — / • Destroy target artifact or enchantment. / • Put a +1/+1 counter on target creature you control. It gains indestructible until end of turn. (Damage and effects that say "destroy" don't destroy it.)
export default card({
  oracleId: '177113f8-1188-4e5e-8ad7-34a7bb8ca7f1',
  name: "Origin of Metalbending",
  spell: { effects: [], modes: { min: 1, max: 1, options: [
    { targets: [{ objects: { types: ['Artifact', 'Enchantment'] } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target artifact or enchantment.' },
    { targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }, { grant: { target: 0 }, keywords: ['indestructible'], duration: 'endOfTurn' }], text: 'Put a +1/+1 counter on target creature you control. It gains indestructible until end of turn.' },
  ] } },
});
