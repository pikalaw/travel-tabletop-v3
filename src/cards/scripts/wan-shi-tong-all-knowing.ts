import { TOKENS } from '../tokens';
import { card } from '../script';

// Wan Shi Tong, All-Knowing: Flying / When Wan Shi Tong enters, target nonland permanent's owner puts it into their library second from the top or on the bottom. / Whenever one or more cards are put into a library from anywhere, create two 1/1 colorless Spirit creature tokens with "This token can't block or be blocked by non-Spirit creatures."
export default card({
  oracleId: '6927bd2e-cb05-487a-af86-89ede6e8dabd',
  name: "Wan Shi Tong, All-Knowing",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { notTypes: ['Land'] } }], effects: [{ toOwnersLibrary: { target: 0 }, places: ['secondFromTop', 'bottom'] }], text: "When Wan Shi Tong enters, target nonland permanent's owner puts it into their library second from the top or on the bottom." },
    { when: { toLibrary: true }, oneOrMore: true, effects: [{ createToken: TOKENS.spirit, n: 2 }], text: 'Whenever one or more cards are put into a library from anywhere, create two 1/1 colorless Spirit creature tokens with "This token can\'t block or be blocked by non-Spirit creatures."' },
  ],
});
