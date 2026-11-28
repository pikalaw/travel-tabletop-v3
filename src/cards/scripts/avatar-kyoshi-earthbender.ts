import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Avatar Kyoshi, Earthbender: During your turn, Avatar Kyoshi has hexproof. / At the beginning of combat on your turn, earthbend 8, then untap that land. (Target land you control becomes a 0/0 creature with haste that's still a land. Put eight +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'fd751ed4-4002-4cae-9d1d-1fe0f1fd4965',
  name: "Avatar Kyoshi, Earthbender",
  statics: [{ effect: { affects: 'self', addKeywords: ['hexproof'] }, while: 'yourTurn', text: 'During your turn, Avatar Kyoshi has hexproof.' }],
  triggered: [{ when: { step: 'beginCombat', whose: 'yours' }, targets: [LAND_YOU_CONTROL], effects: [earthbend(8, 0), { untap: { target: 0 } }], text: 'At the beginning of combat on your turn, earthbend 8, then untap that land.' }],
});
