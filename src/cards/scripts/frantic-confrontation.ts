import { card } from '../script';

// Frantic Confrontation: Target creature you control gets +X/+0 and gains first strike and trample until end of turn.
export default card({
  oracleId: 'a866cc05-69b0-45f2-8829-b6ef08193ed1',
  name: "Frantic Confrontation",
  spell: {
    targets: [{ objects: { types: ['Creature'], controller: 'you' } }],
    effects: [{ pump: { target: 0 }, power: 'x', toughness: 0, duration: 'endOfTurn' }, { grant: { target: 0 }, keywords: ['first strike', 'trample'], duration: 'endOfTurn' }],
  },
});
