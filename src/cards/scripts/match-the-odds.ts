import { card } from '../script';
import { TOKENS } from '../tokens';

// Match the Odds: Create a 1/1 white Ally creature token. Put a +1/+1 counter on it for each creature your opponents control.
export default card({
  oracleId: '797d8776-9dcf-45b1-8c5e-1d025f916773',
  name: "Match the Odds",
  spell: { effects: [{ createToken: TOKENS.ally, n: 1 }, { addCounters: '+1/+1', n: { count: { types: ['Creature'], controller: 'opponent' } }, on: 'created' }] },
});
