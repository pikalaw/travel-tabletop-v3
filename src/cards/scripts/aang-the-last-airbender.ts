import { airbend } from '../keywords';
import { card } from '../script';

// Aang, the Last Airbender: Flying / When Aang enters, airbend up to one other target nonland permanent. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.) / Whenever you cast a Lesson spell, Aang gains lifelink until end of turn.
export default card({
  oracleId: '70564c3a-858f-498e-8b92-acb3ca54ae7e',
  name: "Aang, the Last Airbender",
  triggered: [
    { when: { enters: {} }, self: true, targets: [{ objects: { notTypes: ['Land'], other: true }, upTo: true }], effects: [airbend(0)], text: 'When Aang enters, airbend up to one other target nonland permanent.' },
    { when: { cast: { subtypes: ['Lesson'] }, by: 'you' }, effects: [{ grant: 'self', keywords: ['lifelink'], duration: 'endOfTurn' }], text: 'Whenever you cast a Lesson spell, Aang gains lifelink until end of turn.' },
  ],
});
