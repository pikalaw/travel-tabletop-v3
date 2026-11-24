import { landcycling } from '../keywords';
import { card } from '../script';

// Giant Koi: Waterbend {3}: This creature can't be blocked this turn. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.) / Islandcycling {2} ({2}, Discard this card: Search your library for an Island card, reveal it, put it into your hand, then shuffle.)
export default card({
  oracleId: 'c93bb65a-a74a-499b-a538-65272079aab8',
  name: "Giant Koi",
  activated: [
    { cost: { waterbend: 3 }, effects: [{ grant: 'self', keywords: ["can't be blocked"], duration: 'endOfTurn' }], text: "Waterbend {3}: This creature can't be blocked this turn." },
    landcycling('Island'),
  ],
});
