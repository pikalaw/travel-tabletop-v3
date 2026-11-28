import { card } from '../script';

// Rumble Arena: Vigilance / When this land enters, scry 1. (Look at the top card of your library. You may put it on the bottom.) / {T}: Add {C}. / {1}, {T}: Add one mana of any color.
export default card({
  oracleId: '83f2470e-2114-4cd9-ab1a-21b76e9cdf63',
  name: "Rumble Arena",
  triggered: [{ when: { enters: {} }, self: true, effects: [{ scry: 1 }], text: 'When this land enters, scry 1.' }],
  activated: [
    { cost: { tap: true }, mana: true, effects: [{ addMana: ['C'] }], text: '{T}: Add {C}.' },
    { cost: { mana: '{1}', tap: true }, mana: true, effects: [{ addMana: [], anyColor: true }], text: '{1}, {T}: Add one mana of any color.' },
  ],
});
