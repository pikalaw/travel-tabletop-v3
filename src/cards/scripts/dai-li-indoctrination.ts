import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Dai Li Indoctrination: Choose one — / • Target opponent reveals their hand. You choose a nonland permanent card from it. That player discards that card. / • Earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: '5591efbc-1b2c-489a-b4f3-935c9b6bd71a',
  name: "Dai Li Indoctrination",
  spell: {
    effects: [],
    modes: { min: 1, max: 1, options: [
      {
        targets: [{ players: 'opponent' }],
        effects: [{ revealAndDiscard: { target: 0 }, discards: { types: ['Creature', 'Artifact', 'Enchantment', 'Planeswalker', 'Battle'], notTypes: ['Land'] } }],
        text: 'Target opponent reveals their hand. You choose a nonland permanent card from it. That player discards that card.',
      },
      { targets: [LAND_YOU_CONTROL], effects: [earthbend(2, 0)], text: 'Earthbend 2.' },
    ] },
  },
});
