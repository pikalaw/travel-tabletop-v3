import { TOKENS } from '../tokens';
import { card } from '../script';

// Nyla, Shirshu Sleuth: When Nyla enters, exile up to one target creature card from your graveyard. If you do, you lose X life and create X Clue tokens, where X is that card's mana value. (A Clue token is an artifact with "{2}, Sacrifice this token: Draw a card.") / At the beginning of your end step, if you control no Clues, return target card exiled with Nyla to its owner's hand.
export default card({
  oracleId: '3492cee8-b854-449a-ada4-a4e8a4333d87',
  name: "Nyla, Shirshu Sleuth",
  triggered: [
    {
      when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], zone: 'graveyard', controller: 'you' }, upTo: true }],
      effects: [{ loseLife: 'you', n: { manaValueOf: { target: 0 } } }, { createToken: TOKENS.clue, n: { manaValueOf: { target: 0 } } }, { exile: { target: 0 }, linked: true }],
      text: "When Nyla enters, exile up to one target creature card from your graveyard. If you do, you lose X life and create X Clue tokens, where X is that card's mana value.",
    },
    { when: { step: 'end', whose: 'yours' }, if: { not: { exists: { subtypes: ['Clue'], controller: 'you' } } }, targets: [{ objects: { zone: 'exile', exiledWithSource: true } }], effects: [{ bounce: { target: 0 } }], text: "At the beginning of your end step, if you control no Clues, return target card exiled with Nyla to its owner's hand." },
  ],
});
