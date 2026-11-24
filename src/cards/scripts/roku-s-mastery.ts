import { card } from '../script';

// Roku's Mastery: Roku's Mastery deals X damage to target creature. If X is 4 or more, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)
export default card({
  oracleId: 'e5659c45-e064-4690-b90a-24ffe3793d4d',
  name: "Roku's Mastery",
  spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ damage: 'x', to: { target: 0 } }, { if: { xAtLeast: 4 }, then: [{ scry: 2 }] }] },
});
