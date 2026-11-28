import { firebending } from '../keywords';
import { card } from '../script';

// Ran and Shaw: Flying, firebending 2 / When Ran and Shaw enter, if you cast them and there are three or more Dragon and/or Lesson cards in your graveyard, create a token that's a copy of Ran and Shaw, except it's not legendary. / {3}{R}: Dragons you control get +2/+0 until end of turn.
export default card({
  oracleId: 'a728685f-8670-4db2-ae02-3cf74eb3c402',
  name: "Ran and Shaw",
  triggered: [
    firebending(2),
    {
      when: { enters: {} }, self: true,
      if: { all: ['sourceWasCast', { atLeast: { count: { anyOf: [{ subtypes: ['Dragon'] }, { subtypes: ['Lesson'] }], zone: 'graveyard', controller: 'you' } }, n: 3 }] },
      effects: [{ copySelf: true, notLegendary: true }],
      text: "When Ran and Shaw enter, if you cast them and there are three or more Dragon and/or Lesson cards in your graveyard, create a token that's a copy of Ran and Shaw, except it's not legendary.",
    },
  ],
  activated: [{ cost: { mana: '{3}{R}' }, effects: [{ pump: { all: { subtypes: ['Dragon'], controller: 'you' } }, power: 2, toughness: 0, duration: 'endOfTurn' }], text: '{3}{R}: Dragons you control get +2/+0 until end of turn.' }],
});
