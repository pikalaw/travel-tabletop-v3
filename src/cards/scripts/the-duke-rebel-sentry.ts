import { card } from '../script';

// The Duke, Rebel Sentry: The Duke enters with a +1/+1 counter on him. / {T}, Remove a counter from The Duke: Put a +1/+1 counter on another target creature you control. It gains hexproof until end of turn. (It can't be the target of spells or abilities your opponents control.)
export default card({
  oracleId: '1c55047d-badc-49bb-b791-e9759577e4eb',
  name: "The Duke, Rebel Sentry",
  replacements: [{ replace: { entersWithCounters: '+1/+1', n: 1 }, text: 'The Duke enters with a +1/+1 counter on him.' }],
  activated: [{ cost: { tap: true, removeCounter: true }, targets: [{ objects: { types: ['Creature'], controller: 'you', other: true } }], effects: [{ addCounters: '+1/+1', n: 1, on: { target: 0 } }, { grant: { target: 0 }, keywords: ['hexproof'], duration: 'endOfTurn' }], text: '{T}, Remove a counter from The Duke: Put a +1/+1 counter on another target creature you control. It gains hexproof until end of turn.' }],
});
