import { card } from '../script';

// Zuko's Offense: Zuko's Offense deals 2 damage to any target.
export default card({
  oracleId: '90a2ec9c-2f1c-4ed4-820d-dfdb6b58c0db',
  name: "Zuko's Offense",
  spell: { targets: [{ any: true }], effects: [{ damage: 2, to: { target: 0 } }] },
});
