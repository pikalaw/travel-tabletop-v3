import { card } from '../script';

// Diresight: Surveil 2, then draw two cards. You lose 2 life. (To surveil 2, look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)
export default card({
  oracleId: 'a7b12df9-fddd-4cd4-8c09-d54a47867ab6',
  name: "Diresight",
  spell: { effects: [{ surveil: 2 }, { draw: 'you', n: 2 }, { loseLife: 'you', n: 2 }] },
});
