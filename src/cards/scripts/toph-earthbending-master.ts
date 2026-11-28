import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Toph, Earthbending Master: Landfall — Whenever a land you control enters, you get an experience counter. / Whenever you attack, earthbend X, where X is the number of experience counters you have. (Target land you control becomes a 0/0 creature with haste that's still a land. Put X +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'ad5d3e7e-bf8c-4fa3-a81e-1523aec2585f',
  name: "Toph, Earthbending Master",
  triggered: [
    { when: { enters: { types: ['Land'], controller: 'you' } }, effects: [{ playerCounter: 'experience', n: 1, player: 'you' }], text: 'Landfall — Whenever a land you control enters, you get an experience counter.' },
    { when: { attacks: { controller: 'you' } }, oneOrMore: true, targets: [LAND_YOU_CONTROL], effects: [earthbend({ playerCounters: 'experience' }, 0)], text: 'Whenever you attack, earthbend X, where X is the number of experience counters you have.' },
  ],
});
