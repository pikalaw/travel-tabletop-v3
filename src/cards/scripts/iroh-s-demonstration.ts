import { card } from '../script';

// Iroh's Demonstration: Choose one — / • Iroh's Demonstration deals 1 damage to each creature your opponents control. / • Iroh's Demonstration deals 4 damage to target creature.
export default card({
  oracleId: '8dd2e73a-d1b4-4d26-857f-9eb8e384c8ff',
  name: "Iroh's Demonstration",
  spell: {
    effects: [],
    modes: { min: 1, max: 1, options: [
      { effects: [{ damage: 1, to: { all: { types: ['Creature'], controller: 'opponent' } } }], text: "Iroh's Demonstration deals 1 damage to each creature your opponents control." },
      { targets: [{ objects: { types: ['Creature'] } }], effects: [{ damage: 4, to: { target: 0 } }], text: "Iroh's Demonstration deals 4 damage to target creature." },
    ] },
  },
});
