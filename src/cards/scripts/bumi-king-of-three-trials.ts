import { card } from '../script';

// Bumi, King of Three Trials: When Bumi enters, choose up to X, where X is the number of Lesson cards in your graveyard — / • Put three +1/+1 counters on Bumi. / • Target player scries 3. / • Earthbend 3. (Target land you control becomes a 0/0 creature with haste that's still a land. Put three +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: 'f7493bcf-5c17-4562-a759-37082ec49ff8',
  name: "Bumi, King of Three Trials",
  triggered: [{
    when: { enters: {} }, self: true,
    effects: [{ modal: {
      max: { count: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } },
      options: [
        { text: 'Put three +1/+1 counters on Bumi.', effects: [{ addCounters: '+1/+1', n: 3, on: 'self' }] },
        { text: 'You scry 3.', exclusive: 'scry', effects: [{ scry: 3 }] },
        { text: 'Your opponent scries 3.', exclusive: 'scry', effects: [{ scry: 3, player: 'opponent' }] },
        { text: 'Earthbend 3.', effects: [{ choose: { types: ['Land'], controller: 'you' }, n: 1, text: 'Earthbend 3: choose a land you control', then: [{ earthbend: 3, on: 'chosen' }] }] },
      ],
    } }],
    text: 'When Bumi enters, choose up to X, where X is the number of Lesson cards in your graveyard — • Put three +1/+1 counters on Bumi. • Target player scries 3. • Earthbend 3.',
  }],
});
