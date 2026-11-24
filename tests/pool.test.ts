import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pool, printing } from '../src/cards/pool';

const isBasic = (id: string) => printing(id).typeLine.startsWith('Basic Land');

describe('the bundled card pool', () => {
  it('has the 76 packets: 10 Beginner Box decks and 66 Jumpstart packets, 20 cards each', () => {
    expect(pool.packets).toHaveLength(76);
    expect(pool.packets.filter((p) => p.product === 'Beginner Box')).toHaveLength(10);
    expect(pool.packets.filter((p) => p.product === 'Jumpstart')).toHaveLength(66);
    for (const p of pool.packets) expect(p.cards, p.name).toHaveLength(20);
  });

  it('defines every card the packets name, and 343 different printings in all, plus 11 tokens', () => {
    const inPackets = new Set(pool.packets.flatMap((p) => p.cards));
    for (const id of inPackets) expect(pool.cards[id], id).toBeDefined();
    expect(inPackets.size).toBe(343);
    expect(pool.tokens).toHaveLength(11);
    for (const id of pool.tokens) expect(printing(id).token).toBe(true);
  });

  it('holds no two copies of a non-basic card in one packet, so three packets stay within the 4-copy limit', () => {
    for (const p of pool.packets) {
      const others = p.cards.filter((id) => !isBasic(id));
      expect(new Set(others).size, p.name).toBe(others.length);
    }
  });

  it('has an image file for every printing', () => {
    for (const card of Object.values(pool.cards)) {
      expect(existsSync(new URL(`../public/cards/${card.image}`, import.meta.url)), card.name).toBe(true);
    }
  });

  it('gives packets unique ids', () => {
    expect(new Set(pool.packets.map((p) => p.id)).size).toBe(pool.packets.length);
  });
});
