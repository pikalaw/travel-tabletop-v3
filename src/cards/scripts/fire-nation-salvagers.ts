import { card } from '../script';

// Fire Nation Salvagers: Menace / When this creature enters, put a +1/+1 counter on target creature or Vehicle you control. / Whenever one or more creatures you control with counters on them deal combat damage to a player, put target creature or Vehicle card from that player's graveyard onto the battlefield under your control.
export default card({
  oracleId: '9e76d56a-67b6-4bd9-8f2d-3328d18a2880',
  name: "Fire Nation Salvagers",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { anyOf: [{ types: ['Creature'] }, { subtypes: ['Vehicle'] }], controller: 'you' } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }], text: 'When this creature enters, put a +1/+1 counter on target creature or Vehicle you control.' },
    {
      when: { dealsCombatDamageToPlayer: { types: ['Creature'], controller: 'you', withCounter: '*' } }, oneOrMore: true,
      targets: [{ objects: { anyOf: [{ types: ['Creature'] }, { subtypes: ['Vehicle'] }], zone: 'graveyard', controller: 'opponent' } }],
      effects: [{ returnToBattlefield: { target: 0 } }],
      text: "Whenever one or more creatures you control with counters on them deal combat damage to a player, put target creature or Vehicle card from that player's graveyard onto the battlefield under your control.",
    },
  ],
});
