import { card } from '../script';

// Monk Gyatso: Whenever another creature you control becomes the target of a spell or ability, you may airbend that creature. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.)
export default card({
  oracleId: 'ff92fa60-f0fe-496e-8155-d9d6f5af651b',
  name: "Monk Gyatso",
  triggered: [{ when: { becomesTarget: { types: ['Creature'], controller: 'you', other: true }, by: 'any' }, effects: [{ may: [{ airbend: 'triggerObject' }], text: 'airbend that creature' }], text: 'Whenever another creature you control becomes the target of a spell or ability, you may airbend that creature.' }],
});
