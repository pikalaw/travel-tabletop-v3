import { card } from '../script';

// Pillar Launch: Target creature gets +2/+2 and gains reach until end of turn. Untap it.
export default card({
  oracleId: 'a39c758d-82be-4d8c-bb3e-8ee8a6c6788b',
  name: "Pillar Launch",
  spell: {
    targets: [{ objects: { types: ['Creature'] } }],
    effects: [{ pump: { target: 0 }, power: 2, toughness: 2, duration: 'endOfTurn' }, { grant: { target: 0 }, keywords: ['reach'], duration: 'endOfTurn' }, { untap: { target: 0 } }],
  },
});
