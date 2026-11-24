import { card } from '../script';

// Corrupt Court Official: When this creature enters, target opponent discards a card.
export default card({
  oracleId: 'ec84201d-757f-4a7a-b3a2-85ccd5ee81ae',
  name: "Corrupt Court Official",
  triggered: [{ when: { enters: {} }, self: true, targets: [{ players: 'opponent' }], effects: [{ discard: { target: 0 }, n: 1 }], text: 'When this creature enters, target opponent discards a card.' }],
});
