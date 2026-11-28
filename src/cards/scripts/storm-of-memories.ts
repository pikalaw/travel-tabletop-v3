import { storm } from '../keywords';
import { card } from '../script';

// Storm of Memories: Storm (When you cast this spell, copy it for each spell cast before it this turn.) / Exile an instant or sorcery card with mana value 3 or less from your graveyard at random. You may cast it without paying its mana cost. If that spell would be put into a graveyard, exile it instead.
export default card({
  oracleId: '6f8ca795-d6fd-4e3e-911c-c621a942acbb',
  name: "Storm of Memories",
  triggered: [storm],
  spell: { effects: [{ castRandomFromGraveyard: { types: ['Instant', 'Sorcery'], manaValue: { op: '<=', n: 3 } } }] },
});
