import { card } from '../script';

// Chong and Lily, Nomads: Whenever one or more Bards you control attack, choose one — / • Put a lore counter on each of any number of target Sagas you control. / • Creatures you control get +1/+0 until end of turn for each lore counter among Sagas you control.
export default card({
  oracleId: 'faffc9fb-32b3-4015-8c3f-e6b45002c050',
  name: "Chong and Lily, Nomads",
  triggered: [{
    when: { attacks: { subtypes: ['Bard'], controller: 'you' } }, oneOrMore: true,
    effects: [{ modal: { max: 1, options: [
      { text: 'Put a lore counter on each of any number of target Sagas you control.', effects: [{ choose: { subtypes: ['Saga'], controller: 'you' }, n: { count: { subtypes: ['Saga'], controller: 'you' } }, upTo: true, text: 'Choose Sagas to put a lore counter on', then: [{ addCounters: 'lore', n: 1, on: 'chosen' }] }] },
      { text: 'Creatures you control get +1/+0 until end of turn for each lore counter among Sagas you control.', effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: { counters: 'lore', on: { all: { subtypes: ['Saga'], controller: 'you' } } }, toughness: 0, duration: 'endOfTurn' }] },
    ] } }],
    text: 'Whenever one or more Bards you control attack, choose one — • Put a lore counter on each of any number of target Sagas you control. • Creatures you control get +1/+0 until end of turn for each lore counter among Sagas you control.',
  }],
});
