import { card } from '../script';

// The Spirit Oasis: When The Spirit Oasis enters, draw a card for each Shrine you control. / Whenever another Shrine you control enters, draw a card.
export default card({
  oracleId: 'b677a73c-f179-46bf-83ee-c2b05f9fca67',
  name: "The Spirit Oasis",
  triggered: [
    { when: { enters: {} }, self: true, effects: [{ draw: 'you', n: { count: { subtypes: ['Shrine'], controller: 'you' } } }], text: 'When The Spirit Oasis enters, draw a card for each Shrine you control.' },
    { when: { enters: { subtypes: ['Shrine'], controller: 'you', other: true } }, effects: [{ draw: 'you', n: 1 }], text: 'Whenever another Shrine you control enters, draw a card.' },
  ],
});
