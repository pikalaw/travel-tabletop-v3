import { card } from '../script';

// Foggy Swamp Hunters: As long as you've drawn two or more cards this turn, this creature has lifelink and menace. (It can't be blocked except by two or more creatures.)
export default card({
  oracleId: '1941cf7a-ad53-4bce-beea-104951619a30',
  name: "Foggy Swamp Hunters",
  statics: [{ effect: { affects: 'self', addKeywords: ['lifelink', 'menace'] }, while: { drawnThisTurn: 2 }, text: "As long as you've drawn two or more cards this turn, this creature has lifelink and menace." }],
});
