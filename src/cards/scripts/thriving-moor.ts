import { card } from '../script';

// Thriving Moor: This land enters tapped. As it enters, choose a color other than black. / {T}: Add {B} or one mana of the chosen color.
export default card({
  oracleId: 'bff416bb-d193-4c45-b2c1-7c297dbfad08',
  name: "Thriving Moor",
  replacements: [
    { replace: { entersTapped: true }, text: 'This land enters tapped.' },
    { replace: { entersChoosingColor: { except: 'B' } }, text: 'As it enters, choose a color other than B.' },
  ],
  activated: [{ cost: { tap: true }, mana: true, effects: [{ addMana: ['B'], orChosenColor: true }], text: '{T}: Add {B} or one mana of the chosen color.' }],
});
