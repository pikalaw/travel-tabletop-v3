import { card } from '../script';

// Thriving Isle: This land enters tapped. As it enters, choose a color other than blue. / {T}: Add {U} or one mana of the chosen color.
export default card({
  oracleId: '69fc70b8-b143-4662-ac95-e2743037239d',
  name: "Thriving Isle",
  replacements: [
    { replace: { entersTapped: true }, text: 'This land enters tapped.' },
    { replace: { entersChoosingColor: { except: 'U' } }, text: 'As it enters, choose a color other than U.' },
  ],
  activated: [{ cost: { tap: true }, mana: true, effects: [{ addMana: ['U'], orChosenColor: true }], text: '{T}: Add {U} or one mana of the chosen color.' }],
});
