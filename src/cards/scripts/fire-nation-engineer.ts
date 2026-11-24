import { card } from '../script';

// Fire Nation Engineer: Raid — At the beginning of your end step, if you attacked this turn, put a +1/+1 counter on another target creature or Vehicle you control.
export default card({
  oracleId: '9a983666-376b-48a8-9f82-8d041d32ae93',
  name: "Fire Nation Engineer",
  triggered: [{
    when: { step: 'end', whose: 'yours' }, if: { thisTurn: 'youAttacked' },
    targets: [{ objects: { anyOf: [{ types: ['Creature'] }, { subtypes: ['Vehicle'] }], controller: 'you', other: true } }],
    effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }],
    text: 'Raid — At the beginning of your end step, if you attacked this turn, put a +1/+1 counter on another target creature or Vehicle you control.',
  }],
});
