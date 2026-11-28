import type { TriggeredAbility } from '../../engine/abilities';
import { TOKENS } from '../tokens';
import { card } from '../script';

/** Exile up to one target card from a graveyard; a creature card exiled this way makes a Clue. */
const exileOne = (when: TriggeredAbility['when'], text: string): TriggeredAbility => ({
  when, self: true, targets: [{ objects: { zone: 'graveyard' }, upTo: true }],
  effects: [{ if: { target: 0, is: { types: ['Creature'], zone: 'graveyard' } }, then: [{ createToken: TOKENS.clue, n: 1 }] }, { exile: { target: 0 } }],
  text,
});

// Raven Eagle: Flying / Whenever this creature enters or attacks, exile up to one target card from a graveyard. If a creature card is exiled this way, create a Clue token. (It's an artifact with "{2}, Sacrifice this token: Draw a card.") / Whenever you draw your second card each turn, each opponent loses 1 life and you gain 1 life.
export default card({
  oracleId: 'f75ac0a3-8795-48b4-91fd-4717900ef5b7',
  name: "Raven Eagle",
  triggered: [
    exileOne({ enters: {} }, 'When this creature enters, exile up to one target card from a graveyard. If a creature card is exiled this way, create a Clue token.'),
    exileOne({ attacks: {} }, 'Whenever this creature attacks, exile up to one target card from a graveyard. If a creature card is exiled this way, create a Clue token.'),
    { when: { drawsNth: 2 }, effects: [{ loseLife: 'opponent', n: 1 }, { gainLife: 'you', n: 1 }], text: 'Whenever you draw your second card each turn, each opponent loses 1 life and you gain 1 life.' },
  ],
});
