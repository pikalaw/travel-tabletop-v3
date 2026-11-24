import { card } from '../script';

// First-Time Flyer: Flying / This creature gets +1/+1 as long as there's a Lesson card in your graveyard.
export default card({
  oracleId: 'cbbea4e2-4b36-4965-89b6-00d2a564f146',
  name: "First-Time Flyer",
  statics: [{ while: { exists: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, effect: { affects: 'self', modify: [1, 1] }, text: "This creature gets +1/+1 as long as there's a Lesson card in your graveyard." }],
});
