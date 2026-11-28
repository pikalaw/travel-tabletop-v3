import { card } from '../script';

// Dramatic Reversal: Untap all nonland permanents you control.
export default card({
  oracleId: 'da46904c-8fb8-44c2-b2ab-775a1cc12ec3',
  name: "Dramatic Reversal",
  spell: { effects: [{ untap: { all: { notTypes: ['Land'], controller: 'you' } } }] },
});
