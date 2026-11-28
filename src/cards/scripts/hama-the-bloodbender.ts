import { card } from '../script';

// Hama, the Bloodbender: When Hama enters, target opponent mills three cards. Exile up to one noncreature, nonland card from that player's graveyard. For as long as you control Hama, you may cast the exiled card during your turn by waterbending {X} rather than paying its mana cost, where X is its mana value. (While paying a waterbend cost, you can tap your artifacts and creatures to help. Each one pays for {1}.)
export default card({
  oracleId: 'ef80e174-78e8-412d-a6fe-89c7af746669',
  name: "Hama, the Bloodbender",
  triggered: [{
    when: { enters: {} }, self: true, targets: [{ players: 'opponent' }],
    effects: [
      { mill: { target: 0 }, n: 3 },
      { choose: { notTypes: ['Creature', 'Land'], zone: 'graveyard', controller: 'opponent' }, n: 1, upTo: true, text: "Exile up to one noncreature, nonland card from that player's graveyard", then: [{ exileCastable: 'chosen', cost: 'waterbendManaValue', whileSource: true, yourTurnOnly: true }] },
    ],
    text: "When Hama enters, target opponent mills three cards. Exile up to one noncreature, nonland card from that player's graveyard. For as long as you control Hama, you may cast the exiled card during your turn by waterbending {X} rather than paying its mana cost, where X is its mana value.",
  }],
});
