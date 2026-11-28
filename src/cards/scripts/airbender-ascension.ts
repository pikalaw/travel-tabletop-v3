import { airbend } from '../keywords';
import { card } from '../script';

// Airbender Ascension: When this enchantment enters, airbend up to one target creature. / Whenever a creature you control enters, put a quest counter on this enchantment. / At the beginning of your end step, if this enchantment has four or more quest counters on it, exile up to one target creature you control, then return it to the battlefield under its owner's control.
export default card({
  oracleId: 'c4d2fdf9-637d-4e97-ae33-45f2d27bf8cd',
  name: "Airbender Ascension",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'] }, upTo: true }], effects: [airbend(0)], text: 'When this enchantment enters, airbend up to one target creature.' },
    { when: { enters: { types: ['Creature'], controller: 'you' } }, effects: [{ addCounters: 'quest', n: 1, on: 'self' }], text: 'Whenever a creature you control enters, put a quest counter on this enchantment.' },
    { when: { step: 'end', whose: 'yours' }, if: { atLeast: { counters: 'quest', on: 'self' }, n: 4 }, targets: [{ objects: { types: ['Creature'], controller: 'you' }, upTo: true }], effects: [{ exileReturns: { target: 0 }, now: true }], text: "At the beginning of your end step, if this enchantment has four or more quest counters on it, exile up to one target creature you control, then return it to the battlefield under its owner's control." },
  ],
});
