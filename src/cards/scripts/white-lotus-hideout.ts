import { card } from '../script';

// White Lotus Hideout: {T}: Add {C}. / {T}: Add one mana of any color. Spend this mana only to cast a Lesson or Shrine spell. / {1}, {T}: Add one mana of any color.
export default card({
  oracleId: '2cdbfda3-98fc-4108-b551-c7049168924e',
  name: "White Lotus Hideout",
  activated: [
    { cost: { tap: true }, mana: true, effects: [{ addMana: ['C'] }], text: '{T}: Add {C}.' },
    { cost: { tap: true }, mana: true, spendOnly: { anyOf: [{ subtypes: ['Lesson'] }, { subtypes: ['Shrine'] }] }, effects: [{ addMana: [], anyColor: true }], text: '{T}: Add one mana of any color. Spend this mana only to cast a Lesson or Shrine spell.' },
    { cost: { mana: '{1}', tap: true }, mana: true, effects: [{ addMana: [], anyColor: true }], text: '{1}, {T}: Add one mana of any color.' },
  ],
});
