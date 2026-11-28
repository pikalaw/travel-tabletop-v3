import { card } from '../script';

// Overwhelming Victory: Overwhelming Victory deals 5 damage to target creature. Each creature you control gains trample and gets +X/+0 until end of turn, where X is the amount of excess damage dealt this way.
export default card({
  oracleId: '20d94561-7526-4305-8d2d-7daf62729ff4',
  name: "Overwhelming Victory",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [
      { damage: 5, to: { target: 0 } },
      { grant: { all: { types: ['Creature'], controller: 'you' } }, keywords: ['trample'], duration: 'endOfTurn' },
    { pump: { all: { types: ['Creature'], controller: 'you' } }, power: 'excessDamage', toughness: 0, duration: 'endOfTurn' },
    ],
  },
});
