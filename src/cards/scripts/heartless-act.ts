import { card } from '../script';

// Heartless Act: Choose one — / • Destroy target creature with no counters on it. / • Remove up to three counters from target creature.
export default card({
  oracleId: '3641d572-8335-4804-88ad-edf4dc67a8e4',
  name: "Heartless Act",
  spell: {
    effects: [],
    modes: { min: 1, max: 1, options: [
      { targets: [{ objects: { types: ['Creature'], noCounters: true } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target creature with no counters on it.' },
      { targets: [{ objects: { types: ['Creature'] } }], effects: [{ removeAnyCounters: 3, on: { target: 0 } }], text: 'Remove up to three counters from target creature.' },
    ] },
  },
});
