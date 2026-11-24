import { card } from '../script';

// Otter-Penguin: Whenever you draw your second card each turn, this creature gets +1/+2 until end of turn and can't be blocked this turn.
export default card({
  oracleId: 'e2171c48-a816-41b2-aa55-e0ba2503fd6a',
  name: "Otter-Penguin",
  triggered: [{ when: { drawsNth: 2 }, effects: [{ pump: 'self', power: 1, toughness: 2, duration: 'endOfTurn' }, { grant: 'self', keywords: ["can't be blocked"], duration: 'endOfTurn' }], text: "Whenever you draw your second card each turn, this creature gets +1/+2 until end of turn and can't be blocked this turn." }],
});
