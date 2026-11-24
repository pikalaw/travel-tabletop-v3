import { card } from '../script';

// Thriving Heath: This land enters tapped. As it enters, choose a color other than white. / {T}: Add {W} or one mana of the chosen color.
export default card({
  oracleId: 'd1946630-e224-40db-8f0d-388b09622288',
  name: "Thriving Heath",
  replacements: [
    { replace: { entersTapped: true }, text: 'This land enters tapped.' },
    { replace: { entersChoosingColor: { except: 'W' } }, text: 'As it enters, choose a color other than W.' },
  ],
  activated: [{ cost: { tap: true }, mana: true, effects: [{ addMana: ['W'], orChosenColor: true }], text: '{T}: Add {W} or one mana of the chosen color.' }],
});
