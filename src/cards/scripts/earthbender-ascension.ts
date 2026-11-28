import { earthbend, LAND_YOU_CONTROL } from '../keywords';
import { card } from '../script';

// Earthbender Ascension: When this enchantment enters, earthbend 2. Then search your library for a basic land card, put it onto the battlefield tapped, then shuffle. / Landfall — Whenever a land you control enters, put a quest counter on this enchantment. When you do, if it has four or more quest counters on it, put a +1/+1 counter on target creature you control. It gains trample until end of turn.
export default card({
  oracleId: 'f8966fd5-2926-4ba0-b7d6-cfea40cd4e05',
  name: "Earthbender Ascension",
  triggered: [
    { when: { enters: {} }, self: true, targets: [LAND_YOU_CONTROL], effects: [earthbend(2, 0), { search: { types: ['Land'], supertypes: ['Basic'] }, to: 'battlefield', tapped: true }], text: 'When this enchantment enters, earthbend 2. Then search your library for a basic land card, put it onto the battlefield tapped, then shuffle.' },
    {
      when: { enters: { types: ['Land'], controller: 'you' } },
      effects: [
        { addCounters: 'quest', n: 1, on: 'self' },
        { reflexive: {
          if: { atLeast: { counters: 'quest', on: 'self' }, n: 4 },
          targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
          effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }, { grant: { target: 0 }, keywords: ['trample'], duration: 'endOfTurn' }],
          text: 'When you do, if it has four or more quest counters on it, put a +1/+1 counter on target creature you control. It gains trample until end of turn.',
        } },
      ],
      text: 'Landfall — Whenever a land you control enters, put a quest counter on this enchantment.',
    },
  ],
});
