import { equip } from '../keywords';
import { card } from '../script';

// Trusty Boomerang: Equipped creature has "{1}, {T}: Tap target creature. Return Trusty Boomerang to its owner's hand." / Equip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)
export default card({
  oracleId: '3c032e74-69c6-48ca-95d4-51aa3d894c14',
  name: "Trusty Boomerang",
  // The equipped creature's granted ability, as the Equipment's own: it taps the equipped creature, so only that creature can use it.
  activated: [
    { cost: { mana: '{1}', tapAttached: true }, targets: [{ objects: { types: ['Creature'] } }], effects: [{ tap: { target: 0 } }, { bounce: 'self' }], text: 'Equipped creature has "{1}, {T}: Tap target creature. Return Trusty Boomerang to its owner\'s hand."' },
    equip('{1}'),
  ],
});
