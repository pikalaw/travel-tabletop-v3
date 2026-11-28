import type { TriggeredAbility } from '../../engine/abilities';
import { card } from '../script';

// Appa, Loyal Sky Bison: Flying / Whenever Appa enters or attacks, choose one — / • Target creature you control gains flying until end of turn. / • Airbend another target nonland permanent you control. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.)
export default card({
  oracleId: 'c6e28cf0-81c7-4f52-a29b-988cc6fd31ee',
  name: "Appa, Loyal Sky Bison",
  triggered: (['enters', 'attacks'] as const).map((on): TriggeredAbility => ({
    when: on !== 'attacks' ? { enters: {} } : { attacks: {} }, self: true,
    effects: [{ modal: { max: 1, options: [
      { text: 'Target creature you control gains flying until end of turn.', effects: [{ choose: { types: ['Creature'], controller: 'you' }, n: 1, text: 'Choose a creature you control to gain flying', then: [{ grant: 'chosen', keywords: ['flying'], duration: 'endOfTurn' }] }] },
      { text: 'Airbend another target nonland permanent you control.', effects: [{ choose: { notTypes: ['Land'], controller: 'you', other: true }, n: 1, text: 'Choose another nonland permanent you control to airbend', then: [{ airbend: 'chosen' }] }] },
    ] } }],
    text: `Whenever Appa ${on}, choose one — • Target creature you control gains flying until end of turn. • Airbend another target nonland permanent you control.`,
  })),
});
