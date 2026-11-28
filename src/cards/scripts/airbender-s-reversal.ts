import { airbend } from '../keywords';
import { card } from '../script';

// Airbender's Reversal: Choose one — / • Destroy target attacking creature. / • Airbend target creature you control. (Exile it. While it's exiled, its owner may cast it for {2} rather than its mana cost.)
export default card({
  oracleId: '64e3791b-de99-4eed-af49-cbec218c28aa',
  name: "Airbender's Reversal",
  spell: { effects: [], modes: { min: 1, max: 1, options: [
    { targets: [{ objects: { types: ['Creature'], attacking: true } }], effects: [{ destroy: { target: 0 } }], text: 'Destroy target attacking creature.' },
    { targets: [{ objects: { types: ['Creature'], controller: 'you' } }], effects: [airbend(0)], text: 'Airbend target creature you control.' },
  ] } },
});
