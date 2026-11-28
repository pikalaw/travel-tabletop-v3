import { card } from '../script';

// Fancy Footwork: Untap one or two target creatures. They each get +2/+2 until end of turn.
export default card({
  oracleId: 'c5648a32-98b0-4625-aae1-ae56e0ef0197',
  name: "Fancy Footwork",
  spell: { targets: [{ objects: { types: ['Creature'] }, count: 2, upTo: true }], effects: [{ untap: { target: 0 } }, { pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }] },
});
