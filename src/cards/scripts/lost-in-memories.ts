import { card } from '../script';

// Lost in Memories: Flash / Enchant creature you control / Enchanted creature gets +1/+1 and has "Whenever this creature deals combat damage to a player, target instant or sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost." (You may cast that card from your graveyard for its flashback cost. Then exile it.)
export default card({
  oracleId: '69ac3757-66f8-47d4-af7b-dda66c96c254',
  name: "Lost in Memories",
  spell: { effects: [], enchant: { types: ['Creature'], controller: 'you' } },
  statics: [{ effect: { affects: 'attachedTo', modify: [1, 1] }, text: 'Enchanted creature gets +1/+1.' }],
  triggered: [{
    when: { dealsCombatDamageToPlayer: { attached: true } }, targets: [{ objects: { types: ['Instant', 'Sorcery'], zone: 'graveyard', controller: 'you' } }],
    effects: [{ grantFlashback: { target: 0 } }],
    text: 'Enchanted creature has "Whenever this creature deals combat damage to a player, target instant or sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost."',
  }],
});
