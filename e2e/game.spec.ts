/**
 * Whole games through the screen (M3's gate): two players share one phone, and no hand is ever
 * drawn for the wrong person. A scripted player taps through real Beginner Box decks at random:
 * casting, attacking, blocking, answering every prompt, passing from the hand-off bar or looking.
 */
import { expect, test, type Page } from '@playwright/test';

async function newGame(page: Page, seed: number, p1: string[], p2: string[]) {
  await page.goto(`./?seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`./?seed=${seed}`);
  await page.getByTestId('new-game').click();
  await page.getByTestId('name-p1').fill('Lawrence');
  for (const id of p1) await page.getByTestId(`packet-p1-${id}`).click();
  await page.getByTestId('tab-p2').click();
  await page.getByTestId('name-p2').fill('Claire');
  for (const id of p2) await page.getByTestId(`packet-p2-${id}`).click();
  await page.getByTestId('start').click();
  await page.getByTestId('play-first').click();
}

/** Taps through `steps` screens at random; fails on a page error or a hand shown during a hand-off. */
async function playRandomly(page: Page, seed: number, steps: number) {
  let r = seed;
  const rnd = (n: number) => { r = (r * 1103515245 + 12345) % 2147483648; return r % n; };
  const vis = (id: string) => page.getByTestId(id).first().isVisible();
  const enabled = async (id: string) => (await vis(id)) && page.getByTestId(id).first().isEnabled();
  // Overlapped hand cards show only their left strip: tap there, as a player would.
  const any = async (sel: string) => {
    const l = page.locator(sel);
    const n = await l.count();
    if (!n) return false;
    const el = l.nth(rnd(n));
    await ((await el.evaluate((e) => e.classList.contains('card'))) ? el.click({ position: { x: 8, y: 30 } }) : el.click());
    return true;
  };
  for (let i = 0; i < steps; i++) {
    if (await vis('home')) return;
    if (await vis('playback')) { await page.getByTestId('playback').click(); continue; } // tap skips the playback
    if (await vis('handoff')) {
      await expect(page.locator('.hand:not(.folded)'), 'no hand shows during a hand-off').toHaveCount(0);
      await expect(page.locator('.prompt'), 'no prompt shows during a hand-off').toHaveCount(0);
      if ((await vis('bar-pass')) && rnd(3) > 0) await page.getByTestId('bar-pass').click(); else await page.getByTestId('look').click();
      continue;
    }
    if (await vis('card-view')) { await page.getByTestId('close-view').click(); continue; }
    if (await vis('close-sheet')) { await page.getByTestId('close-sheet').click(); continue; }
    if (await vis('keep')) { await page.getByTestId('keep').click(); continue; }
    if (await vis('confirm')) { await page.getByTestId('confirm').click(); if (await vis('cancel')) await page.getByTestId('cancel').click(); continue; }
    if (await vis('accept-order')) { await page.getByTestId('accept-order').click(); continue; }
    if (await vis('x-done')) { await page.getByTestId('x-done').click(); continue; }
    if (await any('.prompt .pipbtn')) continue;
    if (await any('[data-testid^=mode-]:enabled')) continue;
    if (await any('.prompt .chipbtn')) continue;
    if (await vis('yes')) {
      if ((await enabled('yes')) && rnd(2)) await page.getByTestId('yes').click();
      else if (!(await enabled('yes')) && (await page.locator('.prompt .cardlist .card.pickable').count()) && rnd(2)) await page.locator('.prompt .cardlist .card.pickable').first().click();
      else await page.getByTestId('no').click();
      continue;
    }
    if (await vis('attack')) {
      const c = page.locator('.field .card.pickable');
      const n = await c.count();
      for (let k = 0; k < n; k++) if (rnd(2)) await c.nth(k).click();
      await page.getByTestId('attack').click();
      continue;
    }
    if (await vis('block')) {
      if (rnd(2) && (await any('.half.me .field .card.pickable'))) await any('.half.opp .field .card.pickable');
      await page.getByTestId('block').click();
      continue;
    }
    if (await vis('done')) {
      if (await enabled('done')) { await page.getByTestId('done').click(); continue; }
      if (await any('.hand .card.pickable:not(.picked), .prompt .cardlist .card.pickable:not(.picked)')) continue;
      throw new Error(`step ${i}: stuck on Done`);
    }
    if (await vis('pass')) {
      if (rnd(3) && (await any('.hand .card.can, .field .card.glow'))) {
        if (!(await any('[data-testid^=action-]:enabled'))) await page.getByTestId('close-view').click();
        continue;
      }
      await page.getByTestId('pass').click();
      continue;
    }
    throw new Error(`step ${i}: nothing to tap: ${await page.locator('body').innerText()}`);
  }
}

test('a hand-off shows the public board, and Look shows only the acting hand', async ({ page }) => {
  await newGame(page, 7, ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial'], ['bb-waterbending', 'bb-allies', 'bb-spells']);
  await expect(page.getByTestId('handoff')).toContainText('Lawrence to act');
  await expect(page.locator('.hand:not(.folded)')).toHaveCount(0);
  await page.getByTestId('look').click();
  await expect(page.locator('.hand .card')).toHaveCount(7);
  await page.getByTestId('keep').click();
  await expect(page.getByTestId('handoff')).toContainText('Claire to act');
  await expect(page.locator('.hand:not(.folded)')).toHaveCount(0);
});

test('a land is played and a game resumes after a reload, blinded', async ({ page }) => {
  await newGame(page, 7, ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial'], ['bb-waterbending', 'bb-allies', 'bb-spells']);
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click();
  await page.getByTestId('handcard-Mountain').first().click();
  await page.getByTestId('action-play').click();
  await expect(page.getByTestId('lands-p1')).toContainText('Mountain');
  await page.reload();
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('handoff')).toBeVisible();
  await expect(page.getByTestId('lands-p1')).toContainText('Mountain');
});

test('a player resigns from the menu, and the other wins', async ({ page }) => {
  await newGame(page, 7, ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial'], ['bb-waterbending', 'bb-allies', 'bb-spells']);
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click();
  await page.getByTestId('menu').click();
  await page.getByTestId('resign').click();
  await page.getByTestId('confirm-resign').click();
  await expect(page.locator('.foot')).toContainText('Claire wins');
  await expect(page.locator('.foot')).toContainText('Lawrence resigns');
});

for (const seed of [11, 12]) {
  test(`random play through the screen never shows a hand to the wrong player (seed ${seed})`, async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const packets = ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial', 'bb-waterbending', 'bb-allies', 'bb-spells', 'bb-earthbending', 'bb-counters', 'bb-big-creatures', 'bb-aang-tutorial'];
    const k = seed % 4;
    await newGame(page, seed, packets.slice(k, k + 3), packets.slice(k + 3, k + 6));
    await playRandomly(page, seed, 250);
    expect(errors).toEqual([]);
  });
}
