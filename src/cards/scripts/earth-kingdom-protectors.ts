import { card } from '../script';

// Earth Kingdom Protectors: Vigilance / Sacrifice this creature: Another target Ally you control gains indestructible until end of turn. (Damage and effects that say "destroy" don't destroy it.)
export default card({
  oracleId: '3bfb3913-808d-444b-97c3-a90af3bc585b',
  name: "Earth Kingdom Protectors",
  activated: [{ cost: { sacrificeSelf: true }, targets: [{ objects: { subtypes: ['Ally'], controller: 'you', other: true } }], effects: [{ grant: { target: 0 }, keywords: ['indestructible'], duration: 'endOfTurn' }], text: 'Sacrifice this creature: Another target Ally you control gains indestructible until end of turn.' }],
});
