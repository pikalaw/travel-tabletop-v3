import { TOKENS } from '../tokens';
import { card } from '../script';

// True Ancestry: Return up to one target permanent card from your graveyard to your hand. / Create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.")
export default card({
  oracleId: '26c2dd96-07e7-4294-9431-96d5aeff3761',
  name: "True Ancestry",
  spell: { targets: [{ objects: { types: ['Artifact', 'Creature', 'Enchantment', 'Land', 'Planeswalker', 'Battle'], zone: 'graveyard', controller: 'you' }, upTo: true }], effects: [{ bounce: { target: 0 } }, { createToken: TOKENS.clue, n: 1 }] },
});
