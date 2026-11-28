import { card } from '../script';

// Octopus Form: Target creature you control gets +1/+1 and gains hexproof until end of turn. Untap it. (It can't be the target of spells or abilities your opponents control.)
export default card({
  oracleId: '6fec368d-374d-4318-861b-ff478ba51a3c',
  name: "Octopus Form",
  spell: {
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
    effects: [{ pump: { target: 0 }, power: 1, toughness: 1, duration: 'endOfTurn' }, { grant: { target: 0 }, keywords: ['hexproof'], duration: 'endOfTurn' }, { untap: { target: 0 } }],
  },
});
