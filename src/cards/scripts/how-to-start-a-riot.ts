import { card } from '../script';

// How to Start a Riot: Target creature gains menace until end of turn. (It can't be blocked except by two or more creatures.) / Creatures target player controls get +2/+0 until end of turn.
export default card({
  oracleId: '268d0056-0d3e-438a-ab17-625a6f5ec68a',
  name: "How to Start a Riot",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }, { players: 'any' }],
    effects: [{ grant: { target: 0 }, keywords: ['menace'], duration: 'endOfTurn' }, { pump: { all: { types: ['Creature'], controlledByTarget: 1 } }, power: 2, toughness: 0, duration: 'endOfTurn' }],
  },
});
