import { card } from '../script';

// Master Piandao: First strike / Whenever Master Piandao attacks, look at the top four cards of your library. You may reveal an Ally, Equipment, or Lesson card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.
export default card({
  oracleId: 'e294d9d2-df91-4410-85d3-8ffb13fb2285',
  name: "Master Piandao",
  triggered: [{
    when: { attacks: {} }, self: true,
    effects: [{ lookAtTop: 4, mayTake: { subtypes: ['Ally', 'Equipment', 'Lesson'] }, rest: 'bottomRandom' }],
    text: 'Whenever Master Piandao attacks, look at the top four cards of your library. You may reveal an Ally, Equipment, or Lesson card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.',
  }],
});
