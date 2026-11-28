import { firebending } from '../keywords';
import { card } from '../script';

// Fire Nation Cadets: This creature has firebending 2 as long as there's a Lesson card in your graveyard. (Whenever this creature attacks, add {R}{R}. This mana lasts until end of combat.) / {2}: This creature gets +1/+0 until end of turn.
export default card({
  oracleId: '5ebfa3f5-f80a-4845-bba7-75c4ddb88682',
  name: "Fire Nation Cadets",
  triggered: [firebending(2, { exists: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } })],
  activated: [{ cost: { mana: '{2}' }, effects: [{ pump: 'self', power: 1, toughness: 0, duration: 'endOfTurn' }], text: '{2}: This creature gets +1/+0 until end of turn.' }],
});
