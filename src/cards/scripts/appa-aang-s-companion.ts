import { card } from '../script';

// Appa, Aang's Companion: Flying (This creature can't be blocked except by creatures with flying or reach.) / Whenever Appa attacks, another target attacking creature without flying gains flying until end of turn.
export default card({
  oracleId: '215215b8-6ddc-4e94-8640-6d324ff65f9c',
  name: "Appa, Aang's Companion",
  triggered: [{
    when: { attacks: {} }, self: true, targets: [{ objects: { types: ['Creature'], attacking: true, other: true, notKeyword: 'flying' } }],
    effects: [{ grant: { target: 0 }, keywords: ['flying'], duration: 'endOfTurn' }],
    text: 'Whenever Appa attacks, another target attacking creature without flying gains flying until end of turn.',
  }],
});
