import { card } from '../script';

// Tale of Momo: This spell costs {2} less to cast if a creature left the battlefield under your control this turn. / Search your library and/or graveyard for an Ally creature card, reveal it, and put it into your hand. If you search your library this way, shuffle.
export default card({
  oracleId: '728157a3-fcd4-4295-85ff-1162dbb64f8a',
  name: "Tale of Momo",
  spell: {
    reduceBy: { when: { thisTurn: 'aCreatureLeftForYou' }, n: 2 },
    effects: [{ search: { types: ['Creature'], subtypes: ['Ally'] }, to: 'hand', graveyardToo: true }],
  },
});
