import { card } from '../script';

// Animal Attendant: {T}: Add one mana of any color. If that mana is spent to cast a non-Human creature spell, that creature enters with an additional +1/+1 counter on it.
export default card({
  oracleId: '787e6cc6-d97a-4229-97d1-ec2377d138d3',
  name: "Animal Attendant",
  activated: [{
    cost: { tap: true }, mana: true, effects: [{ addMana: [], anyColor: true }],
    rider: { spentOn: { types: ['Creature'], notSubtypes: ['Human'] }, counter: '+1/+1' },
    text: '{T}: Add one mana of any color. If that mana is spent to cast a non-Human creature spell, that creature enters with an additional +1/+1 counter on it.',
  }],
});
