import { card } from '../script';

// Long Feng, Grand Secretariat: Whenever another creature you control or a land you control is put into a graveyard from the battlefield, put a +1/+1 counter on target creature you control.
export default card({
  oracleId: '9bf9fe83-b0df-4ef8-ac54-c0d223d4e410',
  name: "Long Feng, Grand Secretariat",
  triggered: [{
    when: { toGraveyard: { anyOf: [{ types: ['Creature'], other: true }, { types: ['Land'] }], controller: 'you' } },
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }],
    text: 'Whenever another creature you control or a land you control is put into a graveyard from the battlefield, put a +1/+1 counter on target creature you control.',
  }],
});
