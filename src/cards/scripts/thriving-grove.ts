import { card } from '../script';

// Thriving Grove: This land enters tapped. As it enters, choose a color other than green. / {T}: Add {G} or one mana of the chosen color.
export default card({
  oracleId: 'a8052556-8962-4130-86a8-6fb7b6a324f7',
  name: "Thriving Grove",
  replacements: [
    { replace: { entersTapped: true }, text: 'This land enters tapped.' },
    { replace: { entersChoosingColor: { except: 'G' } }, text: 'As it enters, choose a color other than G.' },
  ],
  activated: [{ cost: { tap: true }, mana: true, effects: [{ addMana: ['G'], orChosenColor: true }], text: '{T}: Add {G} or one mana of the chosen color.' }],
});
