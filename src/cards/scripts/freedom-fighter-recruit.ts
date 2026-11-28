import { card } from '../script';

// Freedom Fighter Recruit: Freedom Fighter Recruit's power is equal to the number of creatures you control.
export default card({
  oracleId: '33e66662-aea6-480c-b69b-1907d987b69e',
  name: "Freedom Fighter Recruit",
  statics: [{ effect: { affects: 'self', cdaPower: { count: { types: ['Creature'], controller: 'you' } } }, text: "Freedom Fighter Recruit's power is equal to the number of creatures you control." }],
});
