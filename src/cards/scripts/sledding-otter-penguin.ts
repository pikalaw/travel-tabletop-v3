import { card } from '../script';

// Sledding Otter-Penguin: {3}: Put a +1/+1 counter on this creature.
export default card({
  oracleId: '1b115051-a3c8-4c5f-9ad2-82b5a6897c51',
  name: "Sledding Otter-Penguin",
  activated: [{ cost: { mana: '{3}' }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: '{3}: Put a +1/+1 counter on this creature.' }],
});
