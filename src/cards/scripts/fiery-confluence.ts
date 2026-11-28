import { card } from '../script';

// Fiery Confluence: Choose three. You may choose the same mode more than once. / • Fiery Confluence deals 1 damage to each creature. / • Fiery Confluence deals 2 damage to each opponent. / • Destroy target artifact.
export default card({
  oracleId: '3c22e031-4804-4c31-bd3c-c3f29d456b34',
  name: "Fiery Confluence",
  spell: {
    effects: [{ modal: { max: 1, repeat: 3, options: [
      { text: 'Fiery Confluence deals 1 damage to each creature.', effects: [{ damage: 1, to: { all: { types: ['Creature'] } } }] },
      { text: 'Fiery Confluence deals 2 damage to each opponent.', effects: [{ damage: 2, to: 'opponent' }] },
      { text: 'Destroy target artifact.', effects: [{ choose: { types: ['Artifact'] }, n: 1, text: 'Choose an artifact to destroy', then: [{ destroy: 'chosen' }] }] },
    ] } }],
  },
});
