import { card } from '../script';

// Reckless Blaze: Reckless Blaze deals 5 damage to each creature. Whenever a creature you control dealt damage this way dies this turn, add {R}.
export default card({
  oracleId: '75137acb-dc8e-439b-8d84-c5cf682ff6bc',
  name: "Reckless Blaze",
  spell: {
    effects: [
      { delayed: { when: { dies: {} }, effects: [{ addMana: ['R'] }], text: 'Whenever a creature you control dealt damage this way dies this turn, add {R}.' }, about: { all: { types: ['Creature'], controller: 'you' } }, each: true, thisTurn: true },
      { damage: 5, to: { all: { types: ['Creature'] } } },
    ],
  },
});
