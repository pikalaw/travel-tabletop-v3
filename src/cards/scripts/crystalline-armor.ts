import { card } from '../script';

// Crystalline Armor: Enchant creature / Enchanted creature gets +1/+1 for each land you control and has trample.
export default card({
  oracleId: '93d2638b-0c19-4fba-a0ad-84b6a9784eb3',
  name: "Crystalline Armor",
  spell: { effects: [], enchant: { types: ['Creature'] } },
  statics: [{ effect: { affects: 'attachedTo', modify: [{ count: { types: ['Land'], controller: 'you' } }, { count: { types: ['Land'], controller: 'you' } }], addKeywords: ['trample'] }, text: 'Enchanted creature gets +1/+1 for each land you control and has trample.' }],
});
