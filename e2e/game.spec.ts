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
  let stuck = 0;
  for (let i = 0; i < steps; i++) {
    if (await vis('home')) return;
    if (await vis('beat-end')) { await page.getByTestId('beat-end').click(); continue; } // end the playback
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
    // Between two screens (a cast going out, a hand-off coming in) there may be nothing to tap yet.
    if (stuck++ < 25) { await page.waitForTimeout(200); continue; } // a budget over the whole run
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

test('a land is played; a reload returns to the game, blinded; Back goes home', async ({ page }) => {
  await newGame(page, 7, ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial'], ['bb-waterbending', 'bb-allies', 'bb-spells']);
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click();
  await page.getByTestId('handcard-Mountain').first().click();
  await page.getByTestId('action-play').click();
  await expect(page.getByTestId('lands-p1')).toContainText('Mountain');
  // The address names the game: a reload comes straight back to it, blinded.
  expect(page.url()).toMatch(/#game=\w+$/);
  await page.reload();
  await expect(page.getByTestId('handoff')).toBeVisible();
  await expect(page.getByTestId('lands-p1')).toContainText('Mountain');
  // Back goes home, where Resume returns to it; an address naming a game not saved here says so.
  await page.goBack();
  await expect(page.getByTestId('resume')).toBeVisible();
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('handoff')).toBeVisible();
  await page.goto('./#game=nosuchgame');
  await page.reload();
  await expect(page.getByTestId('missing-game')).toBeVisible();
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

test('a cast paid with lands goes straight on the stack, and Undo on the hand-off bar takes it back', async ({ page }) => {
  await newGame(page, 7, ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial'], ['bb-waterbending', 'bb-allies', 'bb-spells']);
  const vis = (id: string) => page.getByTestId(id).first().isVisible();
  const tapCard = (l: ReturnType<Page['locator']>) => l.click({ position: { x: 8, y: 30 } });
  /** Lawrence's first hand card that Cast works on now, or null; lands get played on the way. */
  const findCast = async (): Promise<string | null> => {
    for (const card of await page.locator('.hand .card.can').all()) {
      await tapCard(card);
      if (!(await page.getByTestId('card-view').isVisible())) continue;
      const enabled = async (id: string) => (await page.getByTestId(id).count()) > 0 && page.getByTestId(id).isEnabled();
      if (await enabled('action-cast')) return (await card.getAttribute('data-testid'))!.replace('handcard-', '');
      if (await enabled('action-play')) { await page.getByTestId('action-play').click(); return null; }
      await page.getByTestId('close-view').click();
    }
    return null;
  };
  let name: string | null = null;
  for (let i = 0; i < 120 && !name; i++) {
    await page.waitForTimeout(50); // let the view open or close
    if (await vis('beat-end')) { await page.getByTestId('beat-end').click(); continue; }
    if (await vis('keep')) { await page.getByTestId('keep').click(); continue; }
    if (await page.locator('.prompt .pipbtn').count()) { await page.locator('.prompt .pipbtn').first().click(); continue; }
    if (await vis('handoff')) {
      const lawrence = (await page.getByTestId('handoff').innerText()).startsWith('Lawrence');
      await page.getByTestId(!lawrence && (await vis('bar-pass')) ? 'bar-pass' : 'look').click();
      continue;
    }
    if (await vis('done')) { await tapCard(page.locator('.hand .card.pickable').first()); await page.getByTestId('done').click(); continue; }
    if (await vis('attack')) { await page.getByTestId('attack').click(); continue; }
    if (await vis('block')) { await page.getByTestId('block').click(); continue; }
    if (await vis('pass')) {
      if ((await page.locator('.half.me .name').innerText()) === 'Lawrence' && (name = await findCast())) break;
      if (await vis('pass')) await page.getByTestId('pass').click();
    }
  }
  expect(name).toBeTruthy();
  const hand = await page.locator('.hand .card').count();
  await page.getByTestId('action-cast').click();
  while (await page.locator('.prompt .chipbtn').count()) await page.locator('.prompt .chipbtn').first().click();
  await expect(page.getByTestId('confirm')).toHaveCount(0);
  await expect(page.getByTestId('handoff')).toBeVisible();
  await expect(page.getByTestId('stack-1')).toContainText(name!);
  await expect(page.getByTestId('handoff').getByTestId('menu')).toBeVisible(); // the menu is on every footer
  await page.getByTestId('bar-undo').click();
  await expect(page.getByTestId('handoff')).toHaveCount(0);
  await expect(page.locator('.hand .card')).toHaveCount(hand);
});

test('a new turn announces itself, and the log opens each turn with a banner', async ({ page }) => {
  await newGame(page, 7, ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial'], ['bb-waterbending', 'bb-allies', 'bb-spells']);
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  await page.getByTestId('look').click(); await page.getByTestId('keep').click();
  // Lawrence passes his turn; Claire passes his end step from the hand-off bar: turn 2 is hers.
  await expect(page.getByTestId('turn-flash')).toContainText('Turn 1'); // the first turn, after the mulligans
  const turn2 = page.getByTestId('turn-flash').filter({ hasText: 'Turn 2' });
  for (let i = 0; i < 6 && !(await turn2.isVisible()); i++) {
    if (await page.getByTestId('bar-pass').isVisible()) await page.getByTestId('bar-pass').click();
    else if (await page.getByTestId('look').isVisible()) await page.getByTestId('look').click();
    else await page.getByTestId('pass').click();
  }
  await expect(page.getByTestId('turn-flash')).toContainText('Turn 2');
  await expect(page.getByTestId('turn-flash')).toContainText('Claire');
  await expect(page.getByTestId('turn-flash')).toHaveCount(0, { timeout: 4000 }); // it fades by itself
  await page.getByTestId('menu').click();
  await page.getByTestId('log-button').click();
  await expect(page.locator('.log .turn-head')).toContainText(['Mulligans', 'Turn 2 · Claire']); // turn 1 had no events: Lawrence played first and did nothing
});
