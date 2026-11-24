import { airbend } from '../keywords';
import { card } from '../script';

// Airbending Lesson: Airbend target nonland permanent. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.) / Draw a card.
export default card({
  oracleId: 'e101b744-9175-4aa5-bf80-d6944359e538',
  name: "Airbending Lesson",
  spell: { targets: [{ objects: { notTypes: ['Land'] } }], effects: [airbend(0), { draw: 'you', n: 1 }] },
});
