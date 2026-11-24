import { card } from '../script';

// Azula Always Lies: Choose one or both — / • Target creature gets -1/-1 until end of turn. / • Put a +1/+1 counter on target creature.
export default card({
  oracleId: 'f56c6c35-d09b-4bee-a685-98e9afed13d1',
  name: "Azula Always Lies",
  spell: {
    effects: [],
    modes: { min: 1, max: 2, options: [
      { targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: -1, toughness: -1, duration: 'endOfTurn' }], text: 'Target creature gets -1/-1 until end of turn.' },
      { targets: [{ objects: { types: ['Creature'] } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'Put a +1/+1 counter on target creature.' },
    ] },
  },
});
