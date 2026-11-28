import { card } from '../script';

// Sokka, Swordmaster: Vigilance / Equipment spells you cast cost {1} less to cast for each Ally you control. / At the beginning of combat on your turn, attach up to one target Equipment you control to Sokka.
export default card({
  oracleId: '90b4d288-e950-4182-af62-516549a8712c',
  name: "Sokka, Swordmaster",
  statics: [{ effect: { affects: 'self', reducesCost: { spells: { subtypes: ['Equipment'] }, by: { count: { subtypes: ['Ally'], controller: 'you' } } } }, text: 'Equipment spells you cast cost {1} less to cast for each Ally you control.' }],
  triggered: [{ when: { step: 'beginCombat', whose: 'yours' }, targets: [{ objects: { subtypes: ['Equipment'], controller: 'you' }, upTo: true }], effects: [{ attach: 'self', what: { target: 0 } }], text: 'At the beginning of combat on your turn, attach up to one target Equipment you control to Sokka.' }],
});
