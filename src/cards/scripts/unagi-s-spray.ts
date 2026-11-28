import { card } from '../script';

// Unagi's Spray: Target creature gets -4/-0 until end of turn. If you control a Fish, Octopus, Otter, Seal, Serpent, or Whale, draw a card.
export default card({
  oracleId: '74b8976a-15cb-4604-a65d-ca9735cd6000',
  name: "Unagi's Spray",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [
      { pump: { target: 0 }, power: -4, toughness: 0, duration: 'endOfTurn' },
      { if: { exists: { subtypes: ['Fish', 'Octopus', 'Otter', 'Seal', 'Serpent', 'Whale'], controller: 'you' } }, then: [{ draw: 'you', n: 1 }] },
    ],
  },
});
