/** The device session: who the board faces, when hands may show, and hand-offs. */
import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/engine/engine';
import type { Choice } from '../src/engine/types';
import { current, newGame } from '../src/host/controller';
import { acting, choose, handingOff, look, startSession, visibleHand, type Session } from '../src/host/session';
import { deck, setup } from './engine-support';

function ok(x: Session | { refused: string }): Session {
  if ('refused' in x) throw new Error(x.refused);
  return x;
}

/** Both keep, then p1 is in their first main phase with a Mountain and a goblin in hand. */
function atMain(): Session {
  for (let seed = 1; ; seed++) {
    let x = startSession(newGame(setup(deck('mountain', ['goblin'], 40), deck('forest', ['bear'], 40)), seed));
    x = ok(choose(look(x), { kind: 'keep' }));
    x = ok(choose(look(x), { kind: 'keep' }));
    const acts = legalActions(current(x.game));
    if (acts.some((c) => c.kind === 'play')) return x;
  }
}

describe('the device session', () => {
  it('starts blinded, facing the first player; Look shows only the acting hand', () => {
    const x = startSession(newGame(setup(), 1));
    expect(x.facing).toBe('p1');
    expect(handingOff(x)).toBe(true);
    expect(visibleHand(x)).toBeNull();
    const seen = look(x);
    expect(visibleHand(seen)).toBe('p1');
    expect(ok(choose(seen, { kind: 'keep' })).facing).toBe('p1'); // p2's mulligan: a hand-off
    expect(visibleHand(ok(choose(seen, { kind: 'keep' })))).toBeNull();
  });

  it('a new turn faces the active player, blinded', () => {
    const x = atMain();
    expect(x.facing).toBe('p1');
    expect(x.revealed).toBe(false);
    expect(visibleHand(look(x))).toBe('p1');
  });

  it('a pass from the hand-off bar flips nothing, and the hand shows again', () => {
    let x = look(atMain());
    const s = current(x.game);
    const land = legalActions(s).find((c) => c.kind === 'play')!;
    x = ok(choose(x, land));
    const cast = legalActions(current(x.game)).find((c): c is Choice & { kind: 'cast' } => c.kind === 'cast')!;
    x = ok(choose(x, cast));
    expect(acting(x)).toBe('p2'); // the stack window
    expect(handingOff(x)).toBe(true);
    expect(visibleHand(x)).toBeNull();
    expect('refused' in choose(x, { kind: 'pass' })).toBe(true); // p2 must Look, or pass from the bar
    x = ok(choose(x, { kind: 'pass' }, true));
    expect(x.facing).toBe('p1');
    expect(visibleHand(x)).toBe('p1');
  });

  it('after the other player looks and acts, the board flips back blinded', () => {
    let x = look(atMain());
    x = ok(choose(x, legalActions(current(x.game)).find((c) => c.kind === 'play')!));
    x = ok(choose(x, legalActions(current(x.game)).find((c) => c.kind === 'cast')!));
    x = look(x);
    expect(x.facing).toBe('p2');
    expect(visibleHand(x)).toBe('p2');
    x = ok(choose(x, { kind: 'pass' }));
    expect(x.facing).toBe('p1');
    expect(x.revealed).toBe(false);
    expect(visibleHand(x)).toBeNull();
  });
});
