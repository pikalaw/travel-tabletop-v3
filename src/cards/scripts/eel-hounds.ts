import { card } from '../script';

// Eel-Hounds: Trample (This creature can deal excess combat damage to the player it's attacking.) / Whenever this creature attacks, another target creature you control gets +2/+2 and gains trample until end of turn.
export default card({
  oracleId: '25432a3a-bcfd-4c43-b662-07676e9b3fdd',
  name: "Eel-Hounds",
  triggered: [{
    when: { attacks: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'you', other: true } }],
    effects: [{ pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }, { grant: { target: 0 }, keywords: ['trample'], duration: 'endOfTurn' }],
    text: 'Whenever this creature attacks, another target creature you control gets +2/+2 and gains trample until end of turn.',
  }],
});
