import { card } from '../script';

// Diligent Zookeeper: Each non-Human creature you control gets +1/+1 for each of its creature types, to a maximum of 10.
export default card({
  oracleId: '6a84a8a4-c8b0-45ce-af6f-605fcffc395b',
  name: "Diligent Zookeeper",
  statics: [{
    effect: { affects: { all: { types: ['Creature'], controller: 'you', notSubtypes: ['Human'] } }, modify: [{ creatureTypesOf: 'affected', max: 10 }, { creatureTypesOf: 'affected', max: 10 }] },
    text: 'Each non-Human creature you control gets +1/+1 for each of its creature types, to a maximum of 10.',
  }],
});
