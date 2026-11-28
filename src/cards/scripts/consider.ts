import { card } from '../script';

// Consider: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.) / Draw a card.
export default card({
  oracleId: '4c9bcba6-87b5-4fb3-97ee-6fe5b739337d',
  name: "Consider",
  spell: { effects: [{ surveil: 1 }, { draw: 'you', n: 1 }] },
});
