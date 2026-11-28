import { card } from '../script';

// Fang, Roku's Companion: Flying / Whenever Fang attacks, another target legendary creature you control gets +X/+0 until end of turn, where X is Fang's power. / When Fang dies, if he wasn't a Spirit, return this card to the battlefield under your control. He's a Spirit in addition to his other types.
export default card({
  oracleId: '6665bfe2-942c-4b3d-a976-776fe00c99f4',
  name: "Fang, Roku's Companion",
  triggered: [
    { when: { attacks: {} }, self: true, targets: [{ objects: { types: ['Creature'], supertypes: ['Legendary'], controller: 'you', other: true } }], effects: [{ pump: { target: 0 }, power: { powerOf: 'self' }, toughness: 0, duration: 'endOfTurn' }], text: "Whenever Fang attacks, another target legendary creature you control gets +X/+0 until end of turn, where X is Fang's power." },
    { when: { dies: { notSubtypes: ['Spirit'] } }, self: true, effects: [{ returnToBattlefield: 'thisCard', as: { addSubtypes: ['Spirit'] } }], text: "When Fang dies, if he wasn't a Spirit, return this card to the battlefield under your control. He's a Spirit in addition to his other types." },
  ],
});
