import { firebending } from '../keywords';
import { card } from '../script';

// Firebending Student: Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.) / Firebending X, where X is this creature's power. (Whenever this creature attacks, add X {R}. This mana lasts until end of combat.)
export default card({
  oracleId: '1ad3be51-f68b-46d6-b58e-400b50e384f1',
  name: "Firebending Student",
  triggered: [firebending({ powerOf: 'self' })],
});
