import { card } from '../script';

// Feed the Swarm: Destroy target creature or enchantment an opponent controls. You lose life equal to that permanent's mana value.
export default card({
  oracleId: '5825997b-10d7-4a36-972c-a80ddd90b8ed',
  name: "Feed the Swarm",
  spell: {
    targets: [{ objects: { anyOf: [{ types: ['Creature'] }, { types: ['Enchantment'] }], controller: 'opponent' } }],
    // The life loss is the permanent's mana value however the destroy goes, so it is counted first.
    effects: [{ loseLife: 'you', n: { manaValueOf: { target: 0 } } }, { destroy: { target: 0 } }],
  },
});
