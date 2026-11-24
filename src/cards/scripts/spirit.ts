import { card } from '../script';

// Spirit: This token can't block or be blocked by non-Spirit creatures.
export default card({
  oracleId: '9d73d64b-3ef7-43b0-b0c2-203ab976d564',
  name: "Spirit",
  statics: [{ effect: { affects: 'self', addKeywords: ["can't block or be blocked by non-spirit creatures"] }, text: "This token can't block or be blocked by non-Spirit creatures." }],
});
