import { card } from '../script';

// Merchant of Many Hats: {2}{B}: Return this card from your graveyard to your hand.
export default card({
  oracleId: '23820b45-2f3a-4b6e-99ea-d84caccb7e37',
  name: "Merchant of Many Hats",
  activated: [{ cost: { mana: '{2}{B}' }, zone: 'graveyard', effects: [{ bounce: 'self' }], text: '{2}{B}: Return this card from your graveyard to your hand.' }],
});
