import { card } from '../script';

// Lion Vulture: Flying (This creature can't be blocked except by creatures with flying or reach.) / At the beginning of your end step, if an opponent lost life this turn, put a +1/+1 counter on this creature and draw a card. (Damage causes loss of life.)
export default card({
  oracleId: '169d24f3-a308-4a2e-ae25-85dae448994e',
  name: "Lion Vulture",
  triggered: [{ when: { step: 'end', whose: 'yours' }, if: { thisTurn: 'opponentLostLife' }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }, { draw: 'you', n: 1 }], text: 'At the beginning of your end step, if an opponent lost life this turn, put a +1/+1 counter on this creature and draw a card.' }],
});
