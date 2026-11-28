import { card } from '../script';

// Bumi Bash: Choose one — / • Bumi Bash deals damage equal to the number of lands you control to target creature. / • Destroy target land creature or nonbasic land.
export default card({
  oracleId: '629f247c-1e64-4c32-8892-0716ed469d1c',
  name: "Bumi Bash",
  spell: {
    effects: [],
    modes: { min: 1, max: 1, options: [
      { targets: [{ objects: { types: ['Creature'] } }], effects: [{ damage: { count: { types: ['Land'], controller: 'you' } }, to: { target: 0 } }], text: 'Bumi Bash deals damage equal to the number of lands you control to target creature.' },
      { targets: [{ objects: { anyOf: [{ allTypes: ['Land', 'Creature'] }, { types: ['Land'], notSupertypes: ['Basic'] }] } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target land creature or nonbasic land.' },
    ] },
  },
});
