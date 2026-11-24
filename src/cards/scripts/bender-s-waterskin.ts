import { card } from '../script';

// Bender's Waterskin: Untap this artifact during each other player's untap step. / {T}: Add one mana of any color.
export default card({
  oracleId: '3bc46467-323f-4cbf-9d0a-f3d2ae3c3a34',
  name: "Bender's Waterskin",
  replacements: [{ replace: { untapsEachUntapStep: true }, text: "Untap this artifact during each other player's untap step." }],
  activated: [{ cost: { tap: true }, mana: true, effects: [{ addMana: [], anyColor: true }], text: '{T}: Add one mana of any color.' }],
});
