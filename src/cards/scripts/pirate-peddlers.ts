import { card } from '../script';

// Pirate Peddlers: Deathtouch / Whenever you sacrifice another permanent, put a +1/+1 counter on this creature.
export default card({
  oracleId: '4771a871-576e-4a14-92f0-b5b41c63d615',
  name: "Pirate Peddlers",
  triggered: [{ when: { sacrificed: { other: true } }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever you sacrifice another permanent, put a +1/+1 counter on this creature.' }],
});
