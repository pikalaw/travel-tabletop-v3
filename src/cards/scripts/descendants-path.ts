import { card } from '../script';

// Descendants' Path: At the beginning of your upkeep, reveal the top card of your library. If it's a creature card that shares a creature type with a creature you control, you may cast it without paying its mana cost. If you don't cast it, put it on the bottom of your library.
export default card({
  oracleId: 'ba13cbdb-8043-4c1b-8a85-084c86886ac8',
  name: "Descendants' Path",
  triggered: [{
    when: { step: 'upkeep', whose: 'yours' },
    effects: [{ topCard: [{ is: { types: ['Creature'], sharesCreatureTypeWith: { types: ['Creature'], controller: 'you' } }, to: 'castFree', text: 'Cast it without paying its mana cost' }], reveal: true, stay: 'bottom' }],
    text: "At the beginning of your upkeep, reveal the top card of your library. If it's a creature card that shares a creature type with a creature you control, you may cast it without paying its mana cost. If you don't cast it, put it on the bottom of your library.",
  }],
});
