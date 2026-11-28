import { TOKENS } from '../tokens';
import { card } from '../script';

// The Earth King: When The Earth King enters, create a 4/4 green Bear creature token. / Whenever one or more creatures you control with power 4 or greater attack, search your library for up to that many basic land cards, put them onto the battlefield tapped, then shuffle.
export default card({
  oracleId: 'd5770b0f-4493-42e9-a2d7-0e74a28da4ba',
  name: "The Earth King",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.bear, n: 1 }], text: 'When The Earth King enters, create a 4/4 green Bear creature token.' },
    {
      when: { attacks: { types: ['Creature'], controller: 'you', power: { op: '>=', n: 4 } } }, oneOrMore: true,
      effects: [{ search: { types: ['Land'], supertypes: ['Basic'] }, n: { count: { types: ['Creature'], controller: 'you', attacking: true, power: { op: '>=', n: 4 } } }, to: 'battlefield', tapped: true }],
      text: 'Whenever one or more creatures you control with power 4 or greater attack, search your library for up to that many basic land cards, put them onto the battlefield tapped, then shuffle.',
    },
  ],
});
