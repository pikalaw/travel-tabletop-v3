import { landcycling } from '../keywords';
import { TOKENS } from '../tokens';
import { card } from '../script';

// Canyon Crawler: Deathtouch / When this creature enters, create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.") / Swampcycling {2} ({2}, Discard this card: Search your library for a Swamp card, reveal it, put it into your hand, then shuffle.)
export default card({
  oracleId: 'bac94fc9-808b-4dc9-b405-408dd2aa6194',
  name: "Canyon Crawler",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.food, n: 1 }], text: 'When this creature enters, create a Food token.' }],
  activated: [landcycling('Swamp')],
});
