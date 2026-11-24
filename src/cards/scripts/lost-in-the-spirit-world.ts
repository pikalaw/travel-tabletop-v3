import { card } from '../script';
import { TOKENS } from '../tokens';

// Lost in the Spirit World: Return up to one target creature to its owner's hand. Create a 1/1 colorless Spirit creature token with "This token can't block or be blocked by non-Spirit creatures."
export default card({
  oracleId: 'a37adc18-ea11-4972-8d04-936cf3fe2613',
  name: "Lost in the Spirit World",
  spell: { targets: [{ objects: { types: ['Creature'] }, upTo: true }], effects: [{ bounce: { target: 0 } }, { createToken: TOKENS.spirit, n: 1 }] },
});
