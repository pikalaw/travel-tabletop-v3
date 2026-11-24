import { firebending } from '../keywords';
import { card } from '../script';

// Vindictive Warden: Menace (This creature can't be blocked except by two or more creatures.) / Firebending 1 (Whenever this creature attacks, add {R}. This mana lasts until end of combat.) / {3}: This creature deals 1 damage to each opponent.
export default card({
  oracleId: '43b339ec-4d7d-41ac-a5ab-96c6a6de00e2',
  name: "Vindictive Warden",
  triggered: [firebending(1)],
  activated: [{ cost: { mana: '{3}' }, effects: [{ damage: 1, to: 'opponent' }], text: '{3}: This creature deals 1 damage to each opponent.' }],
});
