import { card } from '../script';

// Destined Confrontation: Each player chooses any number of creatures they control with total power 4 or less, then sacrifices all other creatures they control.
export default card({
  oracleId: '9703140f-36ee-4427-a390-c1dbdb9e4ee9',
  name: "Destined Confrontation",
  spell: { effects: [{ keepWithinPower: 4, of: { types: ['Creature'] } }] },
});
