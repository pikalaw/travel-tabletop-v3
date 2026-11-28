import { card } from '../script';

// Lo and Li, Twin Tutors: When Lo and Li enter, search your library for a Lesson or Noble card, reveal it, put it into your hand, then shuffle. / Noble creatures you control and Lesson spells you control have lifelink.
export default card({
  oracleId: 'ad643992-eb9f-4a4a-9b74-a5aee2337f30',
  name: "Lo and Li, Twin Tutors",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ search: { anyOf: [{ subtypes: ['Lesson'] }, { subtypes: ['Noble'] }] }, to: 'hand' }], text: 'When Lo and Li enter, search your library for a Lesson or Noble card, reveal it, put it into your hand, then shuffle.' }],
  statics: [
    { effect: { affects: { all: { types: ['Creature'], subtypes: ['Noble'], controller: 'you' } }, addKeywords: ['lifelink'] }, text: 'Noble creatures you control have lifelink.' },
    { effect: { affects: { all: { subtypes: ['Lesson'], zone: 'stack', controller: 'you' } }, addKeywords: ['lifelink'] }, text: 'Lesson spells you control have lifelink.' },
  ],
});
