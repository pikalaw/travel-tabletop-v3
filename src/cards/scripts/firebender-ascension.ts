import { TOKENS } from '../tokens';
import { card } from '../script';

// Firebender Ascension: When this enchantment enters, create a 2/2 red Soldier creature token with firebending 1. / Whenever a creature you control attacking causes a triggered ability of that creature to trigger, put a quest counter on this enchantment. Then if it has four or more quest counters on it, you may copy that ability. You may choose new targets for the copy.
export default card({
  oracleId: '96cc63af-69d1-4493-b241-0cb244a9e48a',
  name: "Firebender Ascension",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ createToken: TOKENS.soldierFirebending, n: 1 }], text: 'When this enchantment enters, create a 2/2 red Soldier creature token with firebending 1.' },
    {
      when: { attackTriggers: { types: ['Creature'], controller: 'you' } },
      effects: [
        { addCounters: 'quest', n: 1, on: 'self' },
        { if: { atLeast: { counters: 'quest', on: 'self' }, n: 4 }, then: [{ may: [{ copyTrigger: true }], text: 'copy that ability' }] },
      ],
      text: 'Whenever a creature you control attacking causes a triggered ability of that creature to trigger, put a quest counter on this enchantment. Then if it has four or more quest counters on it, you may copy that ability. You may choose new targets for the copy.',
    },
  ],
});
