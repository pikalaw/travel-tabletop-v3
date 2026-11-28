import { TOKENS } from '../tokens';
import { card } from '../script';

// Bastion of Remembrance: When this enchantment enters, create a 1/1 white Human Soldier creature token. / Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.
export default card({
  oracleId: 'c7f33cea-2ec8-4081-9208-a5b1d86721b3',
  name: "Bastion of Remembrance",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.humanSoldier, n: 1 }], text: 'When this enchantment enters, create a 1/1 white Human Soldier creature token.' },
    { when: { dies: { types: ['Creature'], controller: 'you' } }, effects: [{ loseLife: 'opponent', n: 1 }, { gainLife: 'you', n: 1 }], text: 'Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.' },
  ],
});
