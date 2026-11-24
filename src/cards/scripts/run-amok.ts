import { card } from '../script';

// Run Amok: Target attacking creature gets +3/+3 and gains trample until end of turn.
export default card({
  oracleId: 'd463de75-8d3c-4077-a2cc-c304a63acc69',
  name: "Run Amok",
  spell: {
    targets: [{ objects: { types: ['Creature'], attacking: true } }],
    effects: [{ pump: { target: 0 }, power: 3, toughness: 3, duration: 'endOfTurn' }, { grant: { target: 0 }, keywords: ['trample'], duration: 'endOfTurn' }],
  },
});
