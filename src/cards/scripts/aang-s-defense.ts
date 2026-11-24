import { card } from '../script';

// Aang's Defense: Target blocking creature you control gets +2/+2 until end of turn. / Draw a card.
export default card({
  oracleId: '92b617f9-6e6b-42a0-9c45-6ff5f6193051',
  name: "Aang's Defense",
  spell: {
    targets: [{ objects: { types: ['Creature'], blocking: true, controller: 'you' } }],
    effects: [{ pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }, { draw: 'you', n: 1 }],
  },
});
