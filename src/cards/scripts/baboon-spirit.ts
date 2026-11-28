import { TOKENS } from '../tokens';
import { card } from '../script';

// Baboon Spirit: Whenever another nontoken Spirit you control enters, create a 1/1 colorless Spirit creature token with "This token can't block or be blocked by non-Spirit creatures." / {3}{U}: Exile another target creature you control. Return it to the battlefield under its owner's control at the beginning of the next end step.
export default card({
  oracleId: 'eb036e02-f43e-46a2-90f1-931579467c9b',
  name: "Baboon Spirit",
  triggered: [{ when: { enters: { subtypes: ['Spirit'], controller: 'you', token: false, other: true } }, effects: [{ createToken: TOKENS.spirit, n: 1 }], text: 'Whenever another nontoken Spirit you control enters, create a 1/1 colorless Spirit creature token with "This token can\'t block or be blocked by non-Spirit creatures."' }],
  activated: [{ cost: { mana: '{3}{U}' }, targets: [{ objects: { types: ['Creature'], controller: 'you', other: true } }], effects: [{ exileReturns: { target: 0 } }], text: '{3}{U}: Exile another target creature you control. Return it to the battlefield under its owner\'s control at the beginning of the next end step.' }],
});
