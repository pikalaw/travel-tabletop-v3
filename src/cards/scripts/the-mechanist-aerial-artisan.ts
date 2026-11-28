import { TOKENS } from '../tokens';
import { card } from '../script';

// The Mechanist, Aerial Artisan: Whenever you cast a noncreature spell, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.") / {T}: Until end of turn, target artifact token you control becomes a 3/1 Construct artifact creature with flying.
export default card({
  oracleId: 'bad27b43-7716-4ce1-82ba-2a6d437363e7',
  name: "The Mechanist, Aerial Artisan",
  triggered: [{ when: { cast: { notTypes: ['Creature'] }, by: 'you' }, effects: [{ createToken: TOKENS.clue, n: 1 }], text: 'Whenever you cast a noncreature spell, create a Clue token.' }],
  activated: [{
    cost: { tap: true }, targets: [{ objects: { types: ['Artifact'], token: true, controller: 'you' } }],
    effects: [{ continuous: { addTypes: ['Creature'], addSubtypes: ['Construct'], setBase: [3, 1], addKeywords: ['flying'] }, on: { target: 0 }, duration: 'endOfTurn' }],
    text: '{T}: Until end of turn, target artifact token you control becomes a 3/1 Construct artifact creature with flying.',
  }],
});
