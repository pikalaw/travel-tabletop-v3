/**
 * Player colours (PRD, "Setup"): each player picks one from a fixed palette, never the same one.
 * Every place a player's colour shows reads two CSS variables from `.p1` and `.p2` (styles.css):
 * `--role`, the colour for text and outlines, and `--tint`, its RGB for backgrounds. `colorVars`
 * sets them for a game. Gold is left out: it means "selected" and "your move".
 */
import type { PlayerId } from '../engine/types';

export interface PlayerColor { id: string; name: string; role: string; tint: string }

export const PALETTE: readonly PlayerColor[] = [
  { id: 'red', name: 'Red', role: '#ff7b5f', tint: '214, 64, 52' },
  { id: 'blue', name: 'Blue', role: '#7aa7ff', tint: '60, 110, 220' },
  { id: 'green', name: 'Green', role: '#62d68f', tint: '38, 150, 82' },
  { id: 'purple', name: 'Purple', role: '#b48cff', tint: '118, 72, 214' },
  { id: 'teal', name: 'Teal', role: '#4fd2d6', tint: '18, 146, 156' },
  { id: 'pink', name: 'Pink', role: '#ff7fc4', tint: '206, 52, 140' },
];

export const DEFAULT_COLORS: Record<PlayerId, string> = { p1: 'red', p2: 'blue' };

const byId = (id: string | undefined): PlayerColor | undefined => PALETTE.find((c) => c.id === id);

/** The two players' colours: their picks if valid and different, else the defaults. */
export function colorsOf(picked?: Partial<Record<PlayerId, string>>): Record<PlayerId, string> {
  const p1 = byId(picked?.p1) ? picked!.p1! : DEFAULT_COLORS.p1;
  const p2 = byId(picked?.p2) && picked!.p2 !== p1 ? picked!.p2! : p1 === DEFAULT_COLORS.p2 ? DEFAULT_COLORS.p1 : DEFAULT_COLORS.p2;
  return { p1, p2 };
}

/** Pairs some colour-blind players can't tell apart. */
export const hardToTell = (a: string, b: string) => [a, b].sort().join() === 'green,red';

/** The CSS variables `.p1` and `.p2` read, for an element's style. */
export function colorVars(colors: Record<PlayerId, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of ['p1', 'p2'] as const) {
    const c = byId(colors[p])!;
    out[`--${p}-role`] = c.role;
    out[`--${p}-tint`] = c.tint;
  }
  return out;
}
