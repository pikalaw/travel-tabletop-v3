import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Earth Rumble: Earthbend 2. When you do, up to one target creature you control fights target creature an opponent controls. (To earthbend 2, target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped. Creatures that fight each deal damage equal to their power to the other.)
export default card({
  oracleId: 'f04a7763-5fba-42e5-a45a-b3dc2daba902',
  name: "Earth Rumble",
  // The fight is a reflexive trigger ("When you do"); its targets are chosen with the spell's here, both optional.
  spell: {
    targets: [LAND_YOU_CONTROL, { objects: { types: ['Creature'], controller: 'you' }, upTo: true }, { objects: { types: ['Creature'], controller: 'opponent' }, upTo: true }],
    effects: [earthbend(2, 0), { fight: [{ target: 1 }, { target: 2 }] }],
  },
});
