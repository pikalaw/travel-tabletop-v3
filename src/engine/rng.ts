/**
 * The game's one source of randomness (technical design, "Randomness"): xoshiro128**, seeded by
 * splitmix32. Its state is plain data kept in the game state, so undo restores it and a replay
 * from the same seed draws the same numbers.
 */
export type RngState = readonly [number, number, number, number];

/** Expands a 32-bit seed into a generator state that is never all zero. */
export function seedRng(seed: number): RngState {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
  return [next(), next(), next(), next()];
}

const rotl = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0;

/** The next 32-bit unsigned value and the state after it. */
export function nextUint32(state: RngState): [number, RngState] {
  const [a, b, c, d] = state;
  const out = Math.imul(rotl(Math.imul(b, 5) >>> 0, 7), 9) >>> 0;
  const t = (b << 9) >>> 0;
  let c2 = (c ^ a) >>> 0;
  let d2 = (d ^ b) >>> 0;
  const b2 = (b ^ c2) >>> 0;
  const a2 = (a ^ d2) >>> 0;
  c2 = (c2 ^ t) >>> 0;
  d2 = rotl(d2, 11);
  return [out, [a2, b2, c2, d2]];
}

/** A uniform integer in [0, n), without modulo bias. */
export function nextInt(state: RngState, n: number): [number, RngState] {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) throw new RangeError(`nextInt: bad bound ${n}`);
  const limit = 2 ** 32 - (2 ** 32 % n);
  let s = state;
  for (;;) {
    const [x, s2] = nextUint32(s);
    s = s2;
    if (x < limit) return [x % n, s];
  }
}

/** A Fisher–Yates shuffle: a new array, and the state after it. */
export function shuffle<T>(state: RngState, items: readonly T[]): [T[], RngState] {
  const out = items.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const [j, s2] = nextInt(s, i + 1);
    s = s2;
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return [out, s];
}
