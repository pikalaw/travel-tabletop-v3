import { card } from '../script';

// Combustion Technique: Combustion Technique deals damage equal to 2 plus the number of Lesson cards in your graveyard to target creature. If that creature would die this turn, exile it instead.
export default card({
  oracleId: '522a04ff-cbfe-47b0-bd29-ef6fc27a6905',
  name: "Combustion Technique",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [
      { damage: { plus: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, and: 2 }, to: { target: 0 } },
      { exileIfWouldDie: { target: 0 }, duration: 'endOfTurn' },
    ],
  },
});
