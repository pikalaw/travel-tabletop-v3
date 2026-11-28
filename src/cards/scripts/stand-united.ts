import { card } from '../script';

// Stand United: Target creature gets +2/+2 until end of turn. If it's an Ally, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)
export default card({
  oracleId: '5a05ee6e-1812-4792-ad00-6df8fa4fd85f',
  name: "Stand United",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [{ pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }, { if: { target: 0, is: { subtypes: ['Ally'] } }, then: [{ scry: 2 }] }],
  },
});
