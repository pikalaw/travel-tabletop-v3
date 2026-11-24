import { landcycling } from '../keywords';
import { card } from '../script';

// Saber-Tooth Moose-Lion: Reach / Forestcycling {2} ({2}, Discard this card: Search your library for a Forest card, reveal it, put it into your hand, then shuffle.)
export default card({
  oracleId: '7af493e3-15a1-42d6-a66c-82aacabe816f',
  name: "Saber-Tooth Moose-Lion",
  activated: [landcycling('Forest')],
});
