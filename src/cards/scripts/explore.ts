import { card } from '../script';

// Explore: You may play an additional land this turn. / Draw a card.
export default card({
  oracleId: 'b8f566ea-8283-4afa-9ac8-737e26419283',
  name: "Explore",
  spell: { effects: [{ extraLand: 1 }, { draw: 'you', n: 1 }] },
});
