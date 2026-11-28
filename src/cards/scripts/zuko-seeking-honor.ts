import { firebending } from '../keywords';
import { card } from '../script';

// Zuko, Seeking Honor: Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / Whenever you cast a noncreature spell, Zuko gains first strike until end of turn. / Whenever Zuko deals combat damage to a player, put a +1/+1 counter on him.
export default card({
  oracleId: '6e737c52-cbe0-493f-ae46-7bf068e04882',
  name: "Zuko, Seeking Honor",
  triggered: [
    firebending(1),
    { when: { cast: { notTypes: ['Creature'] }, by: 'you' }, effects: [{ grant: 'self', keywords: ['first strike'], duration: 'endOfTurn' }], text: 'Whenever you cast a noncreature spell, Zuko gains first strike until end of turn.' },
    { when: { dealsCombatDamageToPlayer: {} }, self: true, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever Zuko deals combat damage to a player, put a +1/+1 counter on him.' },
  ],
});
