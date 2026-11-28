import { airbend, equip } from '../keywords';
import { card } from '../script';

// Glider Staff: When this Equipment enters, airbend up to one target creature. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.) / Equipped creature gets +1/+1 and has flying. / Equip {2}
export default card({
  oracleId: '823006a8-098c-457a-8546-77ae2457c459',
  name: "Glider Staff",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'] }, upTo: true }], effects: [airbend(0)], text: 'When this Equipment enters, airbend up to one target creature.' }],
  statics: [{ effect: { affects: 'attachedTo', modify: [1, 1], addKeywords: ['flying'] }, text: 'Equipped creature gets +1/+1 and has flying.' }],
  activated: [equip('{2}')],
});
