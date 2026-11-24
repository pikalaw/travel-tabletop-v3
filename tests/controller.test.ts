/** The controller's player-facing options: passing ahead, and holding priority after a cast. */
import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/engine/engine';
import { current, newGame, passAhead, submit, type Game } from '../src/host/controller';
import { deck, setup } from './engine-support';

function ok(g: Game | { refused: string }): Game {
  if ('refused' in g) throw new Error(g.refused);
  return g;
}

/** Both keep; p1 is in their first main phase with a Mountain and a goblin in hand. */
function atMain(): Game {
  for (let seed = 1; ; seed++) {
    let g = newGame(setup(deck('mountain', ['goblin'], 40), deck('forest', ['bear'], 40)), seed);
    g = ok(submit(ok(submit(g, { kind: 'keep' })), { kind: 'keep' }));
    if (legalActions(current(g)).some((c) => c.kind === 'play')) return g;
  }
}

describe('the controller', () => {
  it('passing until end of turn skips the player\'s windows for the rest of the turn only', () => {
    const g = ok(passAhead(atMain(), 'turn'));
    const s = current(g);
    // p1's main 2 window passed by itself: the next stop is p2's, in p1's end step.
    expect(s.step).toBe('end');
    expect(s.decision).toEqual({ kind: 'priority', player: 'p2' });
    // On p2's turn, p1's announcement has run out.
    const next = ok(submit(g, { kind: 'pass' }));
    expect(current(next).turn).toBe(2);
  });

  it('passing this combat stops again in main 2', () => {
    const g = ok(passAhead(atMain(), 'combat'));
    expect(current(g).step).toBe('main2');
    expect(current(g).decision).toEqual({ kind: 'priority', player: 'p1' });
  });

  it('holding priority keeps the caster\'s window with their own spell on the stack', () => {
    let g = atMain();
    g = ok(submit(g, legalActions(current(g)).find((c) => c.kind === 'play')!));
    const cast = legalActions(current(g)).find((c) => c.kind === 'cast')!;
    expect(current(ok(submit(g, cast))).decision).toEqual({ kind: 'priority', player: 'p2' });
    const held = current(ok(submit(g, cast, { hold: true })));
    expect(held.decision).toEqual({ kind: 'priority', player: 'p1' });
    expect(held.zones.stack).toHaveLength(1);
  });
});
