import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Fatal Fissure: Choose target creature. When that creature dies this turn, you earthbend 4. (Target land you control becomes a 0/0 creature with haste that's still a land. Put four +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: '202e45d6-8c7a-46db-85fb-634aa77b4097',
  name: "Fatal Fissure",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [{ delayed: { when: { dies: {} }, targets: [LAND_YOU_CONTROL], effects: [earthbend(4, 0)], text: 'When that creature dies this turn, you earthbend 4.' }, about: { target: 0 }, thisTurn: true }],
  },
});
