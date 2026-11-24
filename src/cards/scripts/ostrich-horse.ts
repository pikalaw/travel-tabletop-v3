import { card } from '../script';

// Ostrich-Horse: When this creature enters, mill three cards. You may put a land card from among them into your hand. If you don't, put a +1/+1 counter on this creature. (To mill three cards, put the top three cards of your library into your graveyard.)
export default card({
  oracleId: '2b6cb199-1564-4214-b24f-624dc962c907',
  name: "Ostrich-Horse",
  triggered: [{
    when: { enters: {} }, self: true,
    effects: [{ lookAtTop: 3, mayTake: { types: ['Land'] }, rest: 'mill', otherwise: [{ addCounters: '+1/+1', n: 1, on: 'self' }] }],
    text: "When this creature enters, mill three cards. You may put a land card from among them into your hand. If you don't, put a +1/+1 counter on this creature.",
  }],
});
