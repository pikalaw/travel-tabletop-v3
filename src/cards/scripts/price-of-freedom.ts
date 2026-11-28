import { card } from '../script';

// Price of Freedom: Destroy target artifact or land an opponent controls. Its controller may search their library for a basic land card, put it onto the battlefield tapped, then shuffle. / Draw a card.
export default card({
  oracleId: '5e6faa98-cf55-430d-87ce-8085f68aa20a',
  name: "Price of Freedom",
  spell: {
    targets: [{ objects: { types: ['Artifact', 'Land'], controller: 'opponent' } }],
    effects: [
      { destroy: { target: 0 } },
      { may: [{ search: { types: ['Land'], supertypes: ['Basic'] }, to: 'battlefield', tapped: true, player: { controllerOf: { target: 0 } } }], by: { controllerOf: { target: 0 } }, text: 'search your library for a basic land card and put it onto the battlefield tapped' },
      { draw: 'you', n: 1 },
    ],
  },
});
