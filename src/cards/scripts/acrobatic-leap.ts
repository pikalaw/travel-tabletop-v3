import { card } from '../script';

// Acrobatic Leap: Target creature gets +1/+3 and gains flying until end of turn. Untap it.
export default card({
  oracleId: '1347224f-421e-4270-8e50-cf25c875909c',
  name: "Acrobatic Leap",
  spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: 1, toughness: 3, duration: 'endOfTurn' }, { grant: { target: 0 }, keywords: ['flying'], duration: 'endOfTurn' }, { untap: { target: 0 } }] },
});
