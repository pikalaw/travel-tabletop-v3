import { card } from '../script';

// Enter the Avatar State: Until end of turn, target creature you control becomes an Avatar in addition to its other types and gains flying, first strike, lifelink, and hexproof. (A creature with hexproof can't be the target of spells or abilities your opponents control.)
export default card({
  oracleId: '4e552be1-0702-4e18-822f-98611f8a8e70',
  name: "Enter the Avatar State",
  spell: {
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
    effects: [{ continuous: { addSubtypes: ['Avatar'], addKeywords: ['flying', 'first strike', 'lifelink', 'hexproof'] }, on: { target: 0 }, duration: 'endOfTurn' }],
  },
});
