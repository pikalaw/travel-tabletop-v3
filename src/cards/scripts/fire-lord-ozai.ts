import { card } from '../script';

// Fire Lord Ozai: Whenever Fire Lord Ozai attacks, you may sacrifice another creature. If you do, add an amount of {R} equal to the sacrificed creature's power. Until end of combat, you don't lose this mana as steps end. / {6}: Exile the top card of each opponent's library. Until end of turn, you may play one of those cards without paying its mana cost.
export default card({
  oracleId: '5945306d-e792-4eae-999b-dfb44b10f062',
  name: "Fire Lord Ozai",
  triggered: [{
    when: { attacks: {} }, self: true,
    effects: [{ optional: { sacrifice: { types: ['Creature'], other: true } }, then: [{ addMana: ['R'], n: { powerOf: 'chosen' }, untilEndOfCombat: true }] }],
    text: "Whenever Fire Lord Ozai attacks, you may sacrifice another creature. If you do, add an amount of {R} equal to the sacrificed creature's power. Until end of combat, you don't lose this mana as steps end.",
  }],
  activated: [{ cost: { mana: '{6}' }, effects: [{ exileCastable: { topOf: 'opponent' }, cost: 'free', thisTurn: true, oneOf: true }], text: "{6}: Exile the top card of each opponent's library. Until end of turn, you may play one of those cards without paying its mana cost." }],
});
