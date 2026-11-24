import { landcycling } from '../keywords';
import { card } from '../script';

// Rabaroo Troop: Landfall — Whenever a land you control enters, this creature gains flying until end of turn and you gain 1 life. / Plainscycling {2} ({2}, Discard this card: Search your library for a Plains card, reveal it, put it into your hand, then shuffle.)
export default card({
  oracleId: '48252207-d345-455c-b655-c2027664e6a6',
  name: "Rabaroo Troop",
  triggered: [{ when: { enters: { types: ['Land'], controller: 'you' } }, effects: [{ grant: 'self', keywords: ['flying'], duration: 'endOfTurn' }, { gainLife: 'you', n: 1 }], text: 'Landfall — Whenever a land you control enters, this creature gains flying until end of turn and you gain 1 life.' }],
  activated: [landcycling('Plains')],
});
