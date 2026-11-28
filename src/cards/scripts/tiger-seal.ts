import { card } from '../script';

// Tiger-Seal: Vigilance / At the beginning of your upkeep, tap this creature. / Whenever you draw your second card each turn, untap this creature.
export default card({
  oracleId: '68f84643-c0f9-4d31-ba2e-38b65ab45d04',
  name: "Tiger-Seal",
  triggered: [
    { when: { step: 'upkeep', whose: 'yours' }, effects: [{ tap: 'self' }], text: 'At the beginning of your upkeep, tap this creature.' },
    { when: { drawsNth: 2 }, effects: [{ untap: 'self' }], text: 'Whenever you draw your second card each turn, untap this creature.' },
  ],
});
