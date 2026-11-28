import { ward } from '../keywords';
import { card } from '../script';

// Benevolent River Spirit: As an additional cost to cast this spell, waterbend {5}. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.) / Flying, ward {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.) / When this creature enters, scry 2.
export default card({
  oracleId: '12d91743-1ccb-4f2b-b2a9-1c2b34f7c8eb',
  name: "Benevolent River Spirit",
  spell: { effects: [], additionalCost: { waterbend: 5 } },
  triggered: [ward('{2}'), { when: { enters: {} }, self: true, effects: [{ scry: 2 }], text: 'When this creature enters, scry 2.' }],
});
