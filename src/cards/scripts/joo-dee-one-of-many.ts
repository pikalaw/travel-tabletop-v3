import { card } from '../script';

// Joo Dee, One of Many: {B}, {T}: Surveil 1. Create a token that's a copy of this creature, then sacrifice an artifact or creature. Activate only as a sorcery. (To surveil 1, look at the top card of your library. You may put it into your graveyard.)
export default card({
  oracleId: '4601ed7b-716e-4c89-b733-1eeabe8bf5a2',
  name: "Joo Dee, One of Many",
  activated: [{
    cost: { mana: '{B}', tap: true }, timing: 'sorcery',
    effects: [
      { surveil: 1 }, { copySelf: true },
      { choose: { types: ['Artifact', 'Creature'], controller: 'you' }, n: 1, text: 'Sacrifice an artifact or creature', then: [{ sacrifice: 'chosen' }] },
    ],
    text: '{B}, {T}: Surveil 1. Create a token that\'s a copy of this creature, then sacrifice an artifact or creature. Activate only as a sorcery.',
  }],
});
