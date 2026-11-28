import { TOKENS } from '../tokens';
import { card } from '../script';

// Unlucky Cabbage Merchant: When this creature enters, create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.") / Whenever you sacrifice a Food, you may search your library for a basic land card and put it onto the battlefield tapped. If you search your library this way, put this creature on the bottom of its owner's library, then shuffle.
export default card({
  oracleId: 'd8f7d4c8-bc50-4bcf-b930-797dcb3c2a21',
  name: "Unlucky Cabbage Merchant",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.food, n: 1 }], text: 'When this creature enters, create a Food token.' },
    {
      when: { sacrificed: { subtypes: ['Food'] } },
      effects: [{ may: [{ search: { types: ['Land'], supertypes: ['Basic'] }, to: 'battlefield', tapped: true }, { shuffleIntoLibrary: 'self' }], text: 'search your library for a basic land card and put it onto the battlefield tapped (this creature goes to the bottom of your library, then you shuffle)' }],
      text: "Whenever you sacrifice a Food, you may search your library for a basic land card and put it onto the battlefield tapped. If you search your library this way, put this creature on the bottom of its owner's library, then shuffle.",
    },
  ],
});
