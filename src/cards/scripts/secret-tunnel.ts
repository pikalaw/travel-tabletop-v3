import { card } from '../script';

// Secret Tunnel: This land can't be blocked. / {T}: Add {C}. / {4}, {T}: Two target creatures you control that share a creature type can't be blocked this turn.
export default card({
  oracleId: '632e2979-d88a-482e-9bb8-57b683c5310f',
  name: "Secret Tunnel",
  statics: [{ effect: { affects: 'self', addKeywords: ["can't be blocked"] }, text: "This land can't be blocked." }],
  activated: [
    { cost: { tap: true }, mana: true, effects: [{ addMana: ['C'] }], text: '{T}: Add {C}.' },
    {
      cost: { mana: '{4}', tap: true }, targets: [{ objects: { types: ['Creature'], controller: 'you' }, count: 2 }],
      effects: [{ if: { targetsShareCreatureType: 0 }, then: [{ grant: { target: 0 }, keywords: ["can't be blocked"], duration: 'endOfTurn' }] }],
      text: "{4}, {T}: Two target creatures you control that share a creature type can't be blocked this turn.",
    },
  ],
});
