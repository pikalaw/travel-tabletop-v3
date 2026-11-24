import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Haru, Hidden Talent: Whenever another Ally you control enters, earthbend 1. (Target land you control becomes a 0/0 creature with haste that's still a land. Put a +1/+1 counter on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: '7488ce54-37c6-475c-b327-59f52f2b1424',
  name: "Haru, Hidden Talent",
  triggered: [{ when: { enters: { subtypes: ['Ally'], controller: 'you', other: true } }, targets: [LAND_YOU_CONTROL], effects: [earthbend(1, 0)], text: 'Whenever another Ally you control enters, earthbend 1.' }],
});
