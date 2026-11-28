import { card } from '../script';

// Pipsqueak, Rebel Strongarm: Pipsqueak can't attack alone unless he has a +1/+1 counter on him.
export default card({
  oracleId: '08a5445b-e9e6-44c3-9bc4-aff1b91c18a7',
  name: "Pipsqueak, Rebel Strongarm",
  statics: [{ effect: { affects: 'self', addKeywords: ["can't attack alone unless it has a +1/+1 counter"] }, text: "Pipsqueak can't attack alone unless he has a +1/+1 counter on him." }],
});
