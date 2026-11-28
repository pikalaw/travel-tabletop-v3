import { card } from '../script';

// Tiger-Dillo: This creature can't attack or block unless you control another creature with power 4 or greater.
export default card({
  oracleId: 'b6e82d4f-4fbf-495c-bebd-982d2a855ad0',
  name: "Tiger-Dillo",
  statics: [{ effect: { affects: 'self', addKeywords: ["can't attack or block"] }, while: { not: { exists: { types: ['Creature'], controller: 'you', other: true, power: { op: '>=', n: 4 } } } }, text: "This creature can't attack or block unless you control another creature with power 4 or greater." }],
});
