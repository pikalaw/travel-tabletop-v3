/**
 * The set's keyword actions and abilities as vocabulary (technical design, "Cards"): written once,
 * used by every script that has them.
 */
import type { Amount, Condition, Effect, TargetSpec, TriggeredAbility } from '../engine/abilities';

/** Firebending N (702.189): "Whenever this creature attacks, add N {R}. This mana lasts until end of combat." */
export const firebending = (n: Amount, onlyIf?: Condition): TriggeredAbility => ({
  when: { attacks: {} }, self: true, ...(onlyIf ? { onlyIf } : {}),
  effects: [{ addMana: ['R'], n, untilEndOfCombat: true }],
  text: `Firebending ${typeof n === 'number' ? n : 'X'}`,
});

/** The target an earthbend needs: "target land you control". */
export const LAND_YOU_CONTROL: TargetSpec = { objects: { types: ['Land'], controller: 'you' } };

/** Earthbend N on the land chosen for target spec `target`. */
export const earthbend = (n: Amount, target: number): Effect => ({ earthbend: n, on: { target } });

/** Airbend the objects chosen for target spec `target`. */
export const airbend = (target: number): Effect => ({ airbend: { target } });
