import { card } from '../script';

// Cat-Gator: Lifelink / When this creature enters, it deals damage equal to the number of Swamps you control to any target.
export default card({
  oracleId: '349e6b9e-40a8-49bc-9cd3-4a22f5363fa5',
  name: "Cat-Gator",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ any: true }], effects: [{ damage: { count: { subtypes: ['Swamp'], controller: 'you' } }, to: { target: 0 } }], text: 'When this creature enters, it deals damage equal to the number of Swamps you control to any target.' }],
});
