import { card } from '../script';

// Longshot, Rebel Bowman: Reach (This creature can block creatures with flying.) / Noncreature spells you cast cost {1} less to cast. / Whenever you cast a noncreature spell, Longshot deals 2 damage to each opponent.
export default card({
  oracleId: 'f93c3468-5b1d-4fa7-a281-1009ea0f2062',
  name: "Longshot, Rebel Bowman",
  statics: [{ effect: { affects: 'self', reducesCost: { spells: { notTypes: ['Creature'] }, by: 1 } }, text: 'Noncreature spells you cast cost {1} less to cast.' }],
  triggered: [{ when: { cast: { notTypes: ['Creature'] }, by: 'you' }, effects: [{ damage: 2, to: 'opponent' }], text: 'Whenever you cast a noncreature spell, Longshot deals 2 damage to each opponent.' }],
});
