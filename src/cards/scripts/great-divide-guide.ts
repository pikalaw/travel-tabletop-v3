import { card } from '../script';

// Great Divide Guide: Each land and Ally you control has "{T}: Add one mana of any color."
export default card({
  oracleId: '79e69a91-d580-47fb-be76-1e32c50d2fa0',
  name: "Great Divide Guide",
  statics: [{ effect: { affects: { all: { controller: 'you', anyOf: [{ types: ['Land'] }, { subtypes: ['Ally'] }] } }, addsMana: { makes: ['W', 'U', 'B', 'R', 'G'] } }, text: 'Each land and Ally you control has "{T}: Add one mana of any color."' }],
});
