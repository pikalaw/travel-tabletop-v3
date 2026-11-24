import { card } from '../script';

// Thriving Bluff: This land enters tapped. As it enters, choose a color other than red. / {T}: Add {R} or one mana of the chosen color.
export default card({
  oracleId: '91fceb34-0f2d-4392-be27-00dcd765637f',
  name: "Thriving Bluff",
  replacements: [
    { replace: { entersTapped: true }, text: 'This land enters tapped.' },
    { replace: { entersChoosingColor: { except: 'R' } }, text: 'As it enters, choose a color other than R.' },
  ],
  activated: [{ cost: { tap: true }, mana: true, effects: [{ addMana: ['R'], orChosenColor: true }], text: '{T}: Add {R} or one mana of the chosen color.' }],
});
