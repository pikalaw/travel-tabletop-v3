import { card } from '../script';

// Air Nomad Student: Flying / At the beginning of your end step, if this creature didn't attack this turn, put a +1/+1 counter on it.
export default card({
  oracleId: 'a468f6ab-c0a8-4295-8b01-7147d3f889b4',
  name: "Air Nomad Student",
  triggered: [{ when: { step: 'end', whose: 'yours' }, if: { not: 'sourceAttackedThisTurn' }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: "At the beginning of your end step, if this creature didn't attack this turn, put a +1/+1 counter on it." }],
});
