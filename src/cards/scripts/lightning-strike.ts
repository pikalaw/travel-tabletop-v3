import { card } from '../script';

// Lightning Strike: Lightning Strike deals 3 damage to any target.
export default card({
  oracleId: 'f34b9bc4-7bfe-47fd-ba23-4eeeb46026eb',
  name: "Lightning Strike",
  spell: { targets: [{ any: true }], effects: [{ damage: 3, to: { target: 0 } }] },
});
