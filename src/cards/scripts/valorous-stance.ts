import { card } from '../script';

// Valorous Stance: Choose one — / • Target creature gains indestructible until end of turn. (Damage and effects that say "destroy" don't destroy it.) / • Destroy target creature with toughness 4 or greater.
export default card({
  oracleId: '1f938353-9081-4dc1-b8e7-d18ece038bd4',
  name: "Valorous Stance",
  spell: { effects: [], modes: { min: 1, max: 1, options: [
    { targets: [{ objects: { types: ['Creature'] } }], effects: [{ grant: { target: 0 }, keywords: ['indestructible'], duration: 'endOfTurn' }], text: 'Target creature gains indestructible until end of turn.' },
    { targets: [{ objects: { types: ['Creature'], toughness: { op: '>=', n: 4 } } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target creature with toughness 4 or greater.' },
  ] } },
});
