import { airbend } from '../keywords';
import { card } from '../script';

// Whirlwind Technique: Target player draws two cards, then discards a card. / Airbend up to two target creatures. (To airbend a creature, exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.)
export default card({
  oracleId: 'a4477852-66eb-4a54-b4c1-760cbf624f82',
  name: "Whirlwind Technique",
  spell: {
    targets: [{ players: 'any' }, { objects: { types: ['Creature'] }, count: 2, upTo: true }],
    effects: [{ draw: { target: 0 }, n: 2 }, { discard: { target: 0 }, n: 1 }, airbend(1)],
  },
});
