import { TOKENS } from '../tokens';
import { airbend } from '../keywords';
import { card } from '../script';

// Aang, Airbending Master: When Aang enters, airbend another target creature. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.) / Whenever one or more creatures you control leave the battlefield without dying, you get an experience counter. / At the beginning of your upkeep, create a 1/1 white Ally creature token for each experience counter you have.
export default card({
  oracleId: 'f3176779-74f7-4136-a701-438feeead7a0',
  name: "Aang, Airbending Master",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], other: true } }], effects: [airbend(0)], text: 'When Aang enters, airbend another target creature.' },
    { when: { leavesWithoutDying: { types: ['Creature'], controller: 'you' } }, oneOrMore: true, effects: [{ playerCounter: 'experience', n: 1, player: 'you' }], text: 'Whenever one or more creatures you control leave the battlefield without dying, you get an experience counter.' },
    { when: { step: 'upkeep', whose: 'yours' }, effects: [{ createToken: TOKENS.ally, n: { playerCounters: 'experience' } }], text: 'At the beginning of your upkeep, create a 1/1 white Ally creature token for each experience counter you have.' },
  ],
});
