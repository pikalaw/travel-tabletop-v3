import { card } from '../script';

// Inspiring Call: Draw a card for each creature you control with a +1/+1 counter on it. Those creatures gain indestructible until end of turn. (Damage and effects that say "destroy" don't destroy them.)
export default card({
  oracleId: '9b9a10ff-5a5d-4df8-88aa-18d84ff9117c',
  name: "Inspiring Call",
  spell: { effects: [
    { draw: 'you', n: { count: { types: ['Creature'], controller: 'you', withCounter: '+1/+1' } } },
    { grant: { all: { types: ['Creature'], controller: 'you', withCounter: '+1/+1' } }, keywords: ['indestructible'], duration: 'endOfTurn' },
  ] },
});
