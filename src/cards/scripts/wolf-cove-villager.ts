import { card } from '../script';

// Wolf Cove Villager: This creature enters tapped.
export default card({
  oracleId: '549a3f53-f90e-4af0-bbc5-2c4b9df30008',
  name: "Wolf Cove Villager",
  replacements: [{ replace: { entersTapped: true }, text: 'This creature enters tapped.' }],
});
