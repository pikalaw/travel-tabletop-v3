import { card } from '../script';

// Hakoda, Selfless Commander: Vigilance / You may look at the top card of your library any time. / You may cast Ally spells from the top of your library. / Sacrifice Hakoda: Creatures you control get +0/+5 and gain indestructible until end of turn.
export default card({
  oracleId: 'de3a469a-e38b-456b-994d-abec1b010e42',
  name: "Hakoda, Selfless Commander",
  statics: [
    { effect: { affects: 'self', revealsLibraryTop: true }, text: 'You may look at the top card of your library any time.' },
    { effect: { affects: 'self', castFromLibraryTop: { subtypes: ['Ally'] } }, text: 'You may cast Ally spells from the top of your library.' },
  ],
  activated: [{ cost: { sacrificeSelf: true }, effects: [{ pump: { all: { types: ['Creature'], controller: 'you' } }, power: 0, toughness: 5, duration: 'endOfTurn' }, { grant: { all: { types: ['Creature'], controller: 'you' } }, keywords: ['indestructible'], duration: 'endOfTurn' }], text: 'Sacrifice Hakoda: Creatures you control get +0/+5 and gain indestructible until end of turn.' }],
});
