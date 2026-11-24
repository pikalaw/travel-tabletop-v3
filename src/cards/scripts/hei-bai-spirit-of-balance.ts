import { card } from '../script';

// Hei Bai, Spirit of Balance: Whenever Hei Bai enters or attacks, you may sacrifice another creature or artifact. If you do, put two +1/+1 counters on Hei Bai. / When Hei Bai leaves the battlefield, put its counters on target creature you control.
export default card({
  oracleId: '8f709660-bb26-409f-9650-e5228ac8db7e',
  name: "Hei Bai, Spirit of Balance",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ optional: { sacrifice: { types: ['Creature', 'Artifact'], other: true } }, then: [{ addCounters: '+1/+1', n: 2, on: 'self' }] }], text: 'Whenever Hei Bai enters, you may sacrifice another creature or artifact. If you do, put two +1/+1 counters on Hei Bai.' },
    { when: { attacks: {} }, self: true, effects: [{ optional: { sacrifice: { types: ['Creature', 'Artifact'], other: true } }, then: [{ addCounters: '+1/+1', n: 2, on: 'self' }] }], text: 'Whenever Hei Bai attacks, you may sacrifice another creature or artifact. If you do, put two +1/+1 counters on Hei Bai.' },
    { when: { leaves: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ putCountersOf: 'self', on: { target: 0 } }], text: 'When Hei Bai leaves the battlefield, put its counters on target creature you control.' },
  ],
});
