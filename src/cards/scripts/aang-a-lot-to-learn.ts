import { card } from '../script';

// Aang, A Lot to Learn: Aang has vigilance as long as there's a Lesson card in your graveyard. / Whenever another creature you control dies, put a +1/+1 counter on Aang.
export default card({
  oracleId: '854278bc-2bcf-45dd-abd5-6aca7a1e5fc9',
  name: "Aang, A Lot to Learn",
  statics: [{ effect: { affects: 'self', addKeywords: ['vigilance'] }, while: { exists: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, text: "Aang has vigilance as long as there's a Lesson card in your graveyard." }],
  triggered: [{ when: { dies: { types: ['Creature'], controller: 'you', other: true } }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever another creature you control dies, put a +1/+1 counter on Aang.' }],
});
