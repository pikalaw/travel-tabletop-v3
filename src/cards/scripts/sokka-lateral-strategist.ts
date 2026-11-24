import { card } from '../script';

// Sokka, Lateral Strategist: Vigilance / Whenever Sokka and at least one other creature attack, draw a card.
export default card({
  oracleId: '427f8ef9-12b3-4fa0-b303-28153566b6dc',
  name: "Sokka, Lateral Strategist",
  triggered: [{
    when: { attacks: {} }, self: true, onlyIf: { exists: { types: ['Creature'], attacking: true, other: true } },
    effects: [{ draw: 'you', n: 1 }], text: 'Whenever Sokka and at least one other creature attack, draw a card.',
  }],
});
