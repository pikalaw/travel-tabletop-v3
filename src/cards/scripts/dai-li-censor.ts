import { card } from '../script';

// Dai Li Censor: {1}, Sacrifice another creature: This creature gets +2/+2 until end of turn. Activate only once each turn.
export default card({
  oracleId: 'f13a8621-4d88-4c1f-8b6e-80f8ef383cd2',
  name: "Dai Li Censor",
  activated: [{ cost: { mana: '{1}', sacrifice: { types: ['Creature'], other: true } }, oncePerTurn: true, effects: [{ pump: 'self', power: 2, toughness: 2, duration: 'endOfTurn' }], text: '{1}, Sacrifice another creature: This creature gets +2/+2 until end of turn. Activate only once each turn.' }],
});
