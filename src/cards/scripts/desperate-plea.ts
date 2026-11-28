import { card } from '../script';

// Desperate Plea: As an additional cost to cast this spell, sacrifice a creature. / Choose one or both — / • Return target creature card from your graveyard to the battlefield if its power is less than or equal to the sacrificed creature's power. / • Destroy target creature.
export default card({
  oracleId: 'bc1ea0ba-46bf-49b6-af95-51eaf1ab915e',
  name: "Desperate Plea",
  spell: {
    additionalCost: { sacrifice: { types: ['Creature'] } },
    effects: [],
    modes: { min: 1, max: 2, options: [
      { targets: [{ objects: { types: ['Creature'], zone: 'graveyard', controller: 'you' } }], effects: [{ if: { compare: { powerOf: { target: 0 } }, op: '<=', with: { powerOf: 'sacrificedForCost' } }, then: [{ returnToBattlefield: { target: 0 } }] }], text: "Return target creature card from your graveyard to the battlefield if its power is less than or equal to the sacrificed creature's power." },
      { targets: [{ objects: { types: ['Creature'] } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target creature.' },
    ] },
  },
});
