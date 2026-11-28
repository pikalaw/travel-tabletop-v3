import { card } from '../script';

// Earth Rumble Wrestlers: Reach / This creature gets +1/+0 and has trample as long as you control a land creature or a land entered the battlefield under your control this turn.
export default card({
  oracleId: '1de17747-27e8-40bb-b6f7-6d5402d4705c',
  name: "Earth Rumble Wrestlers",
  statics: [{
    effect: { affects: 'self', modify: [1, 0], addKeywords: ['trample'] },
    while: { any: [{ exists: { allTypes: ['Land', 'Creature'], controller: 'you' } }, { thisTurn: 'aLandEnteredForYou' }] },
    text: 'This creature gets +1/+0 and has trample as long as you control a land creature or a land entered the battlefield under your control this turn.',
  }],
});
