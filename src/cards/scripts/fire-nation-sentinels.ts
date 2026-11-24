import { card } from '../script';

// Fire Nation Sentinels: Whenever a nontoken creature an opponent controls dies, put a +1/+1 counter on each creature you control.
export default card({
  oracleId: '4ba60296-5612-41ed-bf53-a061783ed3b9',
  name: "Fire Nation Sentinels",
  triggered: [{ when: { dies: { types: ['Creature'], controller: 'opponent', token: false } }, effects: [{ addCounters: '+1/+1', n: 1, on: { all: { types: ['Creature'], controller: 'you' } } }], text: 'Whenever a nontoken creature an opponent controls dies, put a +1/+1 counter on each creature you control.' }],
});
