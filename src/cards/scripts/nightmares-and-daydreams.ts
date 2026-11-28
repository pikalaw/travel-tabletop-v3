import type { TriggeredAbility } from '../../engine/abilities';
import { card } from '../script';

// Nightmares and Daydreams: (As this Saga enters and after your draw step, add a lore counter. Sacrifice after IV.) / I, II, III — Until your next turn, whenever you cast an instant or sorcery spell, target player mills cards equal to that spell's mana value. / IV — Draw a card. If a graveyard has twenty or more cards in it, draw three cards instead.
export default card({
  oracleId: '0403bfb0-2174-4360-994d-68d8ca96fc55',
  name: "Nightmares and Daydreams",
  triggered: [
    ...[1, 2, 3].map((chapter): TriggeredAbility => ({
      when: { lore: true }, chapter,
      effects: [{
        delayed: { when: { cast: { types: ['Instant', 'Sorcery'] }, by: 'you' }, targets: [{ players: 'any' }], effects: [{ mill: { target: 0 }, n: 'eventAmount' }], text: "Whenever you cast an instant or sorcery spell, target player mills cards equal to that spell's mana value." },
        untilYourNextTurn: true,
      }],
      text: `${'I'.repeat(chapter)} — Until your next turn, whenever you cast an instant or sorcery spell, target player mills cards equal to that spell's mana value.`,
    })),
    {
      when: { lore: true }, chapter: 4,
      effects: [{
        if: { any: [{ atLeast: { count: { zone: 'graveyard', controller: 'you' } }, n: 20 }, { atLeast: { count: { zone: 'graveyard', controller: 'opponent' } }, n: 20 }] },
        then: [{ draw: 'you', n: 3 }], else: [{ draw: 'you', n: 1 }],
      }],
      text: 'IV — Draw a card. If a graveyard has twenty or more cards in it, draw three cards instead.',
    },
  ],
});
