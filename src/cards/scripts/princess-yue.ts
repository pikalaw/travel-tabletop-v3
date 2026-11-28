import { card } from '../script';

// Princess Yue: When Princess Yue dies, if she was a nonland creature, return this card to the battlefield tapped under your control. She's a land named Moon. She gains "{T}: Add {C}." (She's still legendary.) / {T}: Scry 2.
export default card({
  oracleId: '08c59e5e-d01c-49b7-a812-8ea75e9e945d',
  name: "Princess Yue",
  triggered: [{
    when: { dies: {} }, self: true, onlyIf: { exists: { self: true, types: ['Creature'], notTypes: ['Land'] } },
    effects: [{ returnToBattlefield: 'thisCard', tapped: true, as: { setTypes: { types: ['Land'], subtypes: [] }, setName: 'Moon', addsMana: { makes: ['C'] } } }],
    text: 'When Princess Yue dies, if she was a nonland creature, return this card to the battlefield tapped under your control. She\'s a land named Moon. She gains "{T}: Add {C}."',
  }],
  activated: [{ cost: { tap: true }, effects: [{ scry: 2 }], text: '{T}: Scry 2.' }],
});
