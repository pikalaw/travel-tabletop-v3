import { card } from '../script';

// Zuko's Conviction: Kicker {4} (You may pay an additional {4} as you cast this spell.) / Return target creature card from your graveyard to your hand. If this spell was kicked, instead put that card onto the battlefield tapped.
export default card({
  oracleId: 'f034e8a3-82f7-4c70-93ea-0bf2688f66e1',
  name: "Zuko's Conviction",
  spell: {
    costOptions: [{ cost: {}, text: 'Not kicked' }, { cost: { mana: '{4}' }, text: 'Kicker {4}' }],
    targets: [{ objects: { types: ['Creature'], zone: 'graveyard', controller: 'you' } }],
    effects: [{ if: { costPaid: 1 }, then: [{ returnToBattlefield: { target: 0 }, tapped: true }], else: [{ bounce: { target: 0 } }] }],
  },
});
