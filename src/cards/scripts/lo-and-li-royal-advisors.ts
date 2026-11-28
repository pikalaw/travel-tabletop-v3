import { card } from '../script';

// Lo and Li, Royal Advisors: Whenever an opponent discards a card or mills one or more cards, put a +1/+1 counter on each Advisor you control. / {2}{U/B}: Target player mills four cards. (They put the top four cards of their library into their graveyard.)
export default card({
  oracleId: 'b5018037-cf4e-46d2-86c3-fb8eec6e44d1',
  name: "Lo and Li, Royal Advisors",
  triggered: [
    { when: { discards: 'opponent' }, effects: [{ addCounters: '+1/+1', n: 1, on: { all: { subtypes: ['Advisor'], controller: 'you' } } }], text: 'Whenever an opponent discards a card, put a +1/+1 counter on each Advisor you control.' },
    { when: { mills: 'opponent' }, effects: [{ addCounters: '+1/+1', n: 1, on: { all: { subtypes: ['Advisor'], controller: 'you' } } }], text: 'Whenever an opponent mills one or more cards, put a +1/+1 counter on each Advisor you control.' },
  ],
  activated: [{ cost: { mana: '{2}{U/B}' }, targets: [{ players: 'any' }], effects: [{ mill: { target: 0 }, n: 4 }], text: '{2}{U/B}: Target player mills four cards.' }],
});
