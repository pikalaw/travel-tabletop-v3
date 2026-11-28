import { TOKENS } from '../tokens';
import { card } from '../script';

// The Cabbage Merchant: Whenever an opponent casts a noncreature spell, create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.") / Whenever a creature deals combat damage to you, sacrifice a Food token. / Tap two untapped Foods you control: Add one mana of any color.
export default card({
  oracleId: 'e31808bb-fb6e-487b-a973-db44961c84ee',
  name: "The Cabbage Merchant",
  triggered: [
    { when: { cast: { notTypes: ['Creature'] }, by: 'opponent' }, effects: [{ createToken: TOKENS.food, n: 1 }], text: 'Whenever an opponent casts a noncreature spell, create a Food token.' },
    { when: { dealsCombatDamageToPlayer: { types: ['Creature'], controller: 'opponent' } }, effects: [{ choose: { subtypes: ['Food'], token: true, controller: 'you' }, n: 1, text: 'Sacrifice a Food token', then: [{ sacrifice: 'chosen' }] }], text: 'Whenever a creature deals combat damage to you, sacrifice a Food token.' },
  ],
  activated: [{ cost: { tapMany: { n: 2, filter: { subtypes: ['Food'] } } }, mana: true, effects: [{ addMana: [], anyColor: true }], text: 'Tap two untapped Foods you control: Add one mana of any color.' }],
});
