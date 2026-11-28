import { TOKENS } from '../tokens';
import { card } from '../script';

// Fire Navy Trebuchet: Defender, reach / Whenever you attack, create a 2/1 colorless Construct artifact creature token with flying named Ballistic Boulder that's tapped and attacking. Sacrifice that token at the beginning of the next end step.
export default card({
  oracleId: '1f018a8c-6ceb-4d03-94a7-8713467c9cf5',
  name: "Fire Navy Trebuchet",
  triggered: [{ when: { attacks: { controller: 'you' } }, oneOrMore: true, effects: [{ createToken: TOKENS.ballisticBoulder, n: 1, tapped: true, attacking: true, sacrificeAtEndStep: true }], text: 'Whenever you attack, create a 2/1 colorless Construct artifact creature token with flying named Ballistic Boulder that\'s tapped and attacking. Sacrifice that token at the beginning of the next end step.' }],
});
