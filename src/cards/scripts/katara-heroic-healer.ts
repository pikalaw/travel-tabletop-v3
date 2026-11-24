import { card } from '../script';

// Katara, Heroic Healer: Lifelink (Damage dealt by this creature also causes you to gain that much life.) / When Katara enters, put a +1/+1 counter on each other creature you control.
export default card({
  oracleId: '703032eb-98b3-4ecf-8b92-4f4f1551c5d7',
  name: "Katara, Heroic Healer",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ addCounters: '+1/+1', n: 1, on: { all: { types: ['Creature'], controller: 'you', other: true } } }], text: 'When Katara enters, put a +1/+1 counter on each other creature you control.' }],
});
