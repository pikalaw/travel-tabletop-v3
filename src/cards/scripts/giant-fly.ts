import { card } from '../script';

// Giant Fly: Flying / Whenever you sacrifice another permanent, this creature gets +1/+0 until end of turn.
export default card({
  oracleId: '439ae30b-348d-480c-8d3d-fe105167bdc4',
  name: "Giant Fly",
  triggered: [{ when: { sacrificed: { other: true } }, effects: [{ pump: 'self', power: 1, toughness: 0, duration: 'endOfTurn' }], text: 'Whenever you sacrifice another permanent, this creature gets +1/+0 until end of turn.' }],
});
