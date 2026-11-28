/**
 * The set's keyword actions and abilities as vocabulary (technical design, "Cards"): written once,
 * used by every script that has them.
 */
import type { ActivatedAbility, Amount, Condition, Effect, TargetSpec, TriggeredAbility } from '../engine/abilities';

/** Firebending N (702.189): "Whenever this creature attacks, add N {R}. This mana lasts until end of combat." */
export const firebending = (n: Amount, onlyIf?: Condition): TriggeredAbility => ({
  when: { attacks: {} }, self: true, ...(onlyIf ? { onlyIf } : {}),
  effects: [{ addMana: ['R'], n, untilEndOfCombat: true }],
  text: `Firebending ${typeof n === 'number' ? n : 'X'}`,
});

/** Storm (702.40): "When you cast this spell, copy it for each spell cast before it this turn." */
export const storm: TriggeredAbility = {
  when: { cast: {}, by: 'you' }, self: true,
  effects: [{ copySpell: 'self', times: 'spellsCastBefore' }],
  text: 'Storm',
};

/** Mentor (702.134): "Whenever this creature attacks, put a +1/+1 counter on target attacking creature with lesser power." */
export const mentor: TriggeredAbility = {
  when: { attacks: {} }, self: true,
  targets: [{ objects: { types: ['Creature'], attacking: true, powerBelowSource: true } }],
  effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }],
  text: 'Mentor',
};

/** The target an earthbend needs: "target land you control". */
export const LAND_YOU_CONTROL: TargetSpec = { objects: { types: ['Land'], controller: 'you' } };

/** Earthbend N on the land chosen for target spec `target`. */
export const earthbend = (n: Amount, target: number): Effect => ({ earthbend: n, on: { target } });

/** Airbend the objects chosen for target spec `target`. */
export const airbend = (target: number): Effect => ({ airbend: { target } });

/** Landcycling {2} (702.29): "{2}, Discard this card: Search your library for a <type> card, reveal it, put it into your hand, then shuffle." */
export const landcycling = (type: string, cost = '{2}'): ActivatedAbility => ({
  cost: { mana: cost, discardSelf: true }, zone: 'hand',
  effects: [{ search: { subtypes: [type] }, to: 'hand' }],
  text: `${type}cycling ${cost}`,
});

/** Equip {N} (702.6): "Attach to target creature you control. Equip only as a sorcery." */
export const equip = (cost: string): ActivatedAbility => ({
  cost: { mana: cost }, timing: 'sorcery', targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
  effects: [{ attach: { target: 0 } }], text: `Equip ${cost}`,
});

/** Ward {N} (702.21): "Whenever this permanent becomes the target of a spell or ability an opponent controls, counter it unless that player pays {N}." */
export const ward = (cost: string): TriggeredAbility => ({
  when: { becomesTarget: {}, by: 'opponent' }, self: true,
  effects: [{ counterUnlessPays: cost, on: 'eventSource' }],
  text: `Ward ${cost}`,
});

/** Crew N (702.122): "Tap any number of untapped creatures you control with total power N or more: This Vehicle becomes an artifact creature until end of turn." */
export const crew = (n: number): ActivatedAbility => ({
  cost: { crew: n },
  effects: [{ continuous: { addTypes: ['Creature'] }, on: 'self', duration: 'endOfTurn' }],
  text: `Crew ${n}`,
});
