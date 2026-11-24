import { card } from '../script';

// Aang, Air Nomad: Flying (This creature can't be blocked except by creatures with flying or reach.) / Vigilance (Attacking doesn't cause this creature to tap.) / Other creatures you control have vigilance.
export default card({
  oracleId: 'e46b2ac6-97d6-48f2-aba3-cd92f8e092c6',
  name: "Aang, Air Nomad",
  statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you', other: true } }, addKeywords: ['vigilance'] }, text: 'Other creatures you control have vigilance.' }],
});
