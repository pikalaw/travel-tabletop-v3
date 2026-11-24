import { card } from '../script';

// Seismic Tutelage: Enchant creature / When this Aura enters, put a +1/+1 counter on enchanted creature. / Whenever enchanted creature attacks, double the number of +1/+1 counters on it.
export default card({
  oracleId: '7ece47b1-0b4b-40ac-a90f-4573a8e3b8bd',
  name: "Seismic Tutelage",
  spell: { effects: [], enchant: { types: ['Creature'] } },
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ addCounters: '+1/+1', n: 1, on: 'attachedTo' }], text: 'When this Aura enters, put a +1/+1 counter on enchanted creature.' },
    { when: { attacks: { attached: true } }, effects: [{ addCounters: '+1/+1', n: { counters: '+1/+1', on: 'triggerObject' }, on: 'triggerObject' }], text: 'Whenever enchanted creature attacks, double the number of +1/+1 counters on it.' },
  ],
});
