import { card } from '../script';

// Cloudshift: Exile target creature you control, then return that card to the battlefield under your control.
export default card({
  oracleId: '6879f5ce-7a1b-4606-bad1-885779b0d456',
  name: "Cloudshift",
  spell: { targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [{ exileReturns: { target: 0 }, now: true }] },
});
