import { card } from '../script';

// South Pole Voyager: Whenever this creature or another Ally you control enters, you gain 1 life. If this is the second time this ability has resolved this turn, draw a card.
export default card({
  oracleId: 'c5173332-68ad-456e-ad85-dd7475464d94',
  name: "South Pole Voyager",
  triggered: [{
    when: { enters: { anyOf: [{ self: true }, { subtypes: ['Ally'] }], controller: 'you' } },
    effects: [{ gainLife: 'you', n: 1 }, { nthResolution: 2, then: [{ draw: 'you', n: 1 }] }],
    text: 'Whenever this creature or another Ally you control enters, you gain 1 life. If this is the second time this ability has resolved this turn, draw a card.',
  }],
});
