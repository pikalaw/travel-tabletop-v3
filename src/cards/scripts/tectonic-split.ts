import { card } from '../script';

// Tectonic Split: As an additional cost to cast this spell, sacrifice half the lands you control, rounded up. / Hexproof / Lands you control have "{T}: Add three mana of any one color."
export default card({
  oracleId: 'b71c3c1e-f927-4192-ac3a-cf6a442ffd00',
  name: "Tectonic Split",
  spell: { effects: [], additionalCost: { sacrifice: { types: ['Land'] }, sacrificeCount: { half: { count: { types: ['Land'], controller: 'you' } } } } },
  statics: [{ effect: { affects: { all: { types: ['Land'], controller: 'you' } }, addsMana: { makes: ['W', 'U', 'B', 'R', 'G'], n: 3 } }, text: 'Lands you control have "{T}: Add three mana of any one color."' }],
});
