/** Touch: a tap opens a hand card's full view, and the tap's own click doesn't close it or press Cast. */
import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true });

async function toLawrencesTurn(page: Page) {
  await page.goto('./?seed=7');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./?seed=7');
  await page.getByTestId('new-game').tap();
  for (const id of ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial']) await page.getByTestId(`packet-p1-${id}`).tap();
  await page.getByTestId('tab-p2').tap();
  for (const id of ['bb-waterbending', 'bb-allies', 'bb-spells']) await page.getByTestId(`packet-p2-${id}`).tap();
  await page.getByTestId('start').tap();
  await page.getByTestId('play-first').tap();
  for (let k = 0; k < 2; k++) { await page.getByTestId('look').tap(); await page.getByTestId('keep').tap(); }
  await page.getByTestId('look').tap();
}

/** A one-finger swipe on the full view's picture, by (dx, dy). */
async function swipe(page: Page, dx: number, dy: number) {
  const b = (await page.getByTestId('full-img').boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / 8, y: y + (dy * i) / 8 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(250);
}

test('a tap on a card in hand opens its full view and leaves it open', async ({ page }) => {
  await toLawrencesTurn(page);
  for (const card of await page.locator('.hand .card').all()) {
    await card.tap();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('card-view')).toBeVisible();
    await expect(page.getByTestId('confirm')).toHaveCount(0);
    await page.getByTestId('close-view').tap();
    await expect(page.getByTestId('card-view')).toHaveCount(0);
  }
});

test('swipes on the full view: sideways steps through the hand, down closes, up plays or casts', async ({ page }) => {
  await toLawrencesTurn(page);
  const names = await page.locator('.hand .card img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).alt));
  await page.locator('.hand .card').first().tap();
  await expect(page.getByTestId('full-img')).toHaveAttribute('alt', names[0]!);
  await swipe(page, -120, 0);
  await expect(page.getByTestId('full-img')).toHaveAttribute('alt', names[1]!);
  await swipe(page, 120, 0);
  await expect(page.getByTestId('full-img')).toHaveAttribute('alt', names[0]!);
  await swipe(page, 0, 150);
  await expect(page.getByTestId('card-view')).toHaveCount(0);
  // swipe up on a land plays it
  await page.getByTestId('handcard-Mountain').first().tap();
  await swipe(page, 0, -150);
  await expect(page.getByTestId('card-view')).toHaveCount(0);
  await expect(page.getByTestId('lands-p1')).toContainText('Mountain');
});

test('holding a button shows its tip; lifting hides it, and the button is not pressed', async ({ page }) => {
  await page.goto('./?seed=7');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./?seed=7');
  await page.getByTestId('new-game').tap();
  for (const id of ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial']) await page.getByTestId(`packet-p1-${id}`).tap();
  await page.getByTestId('tab-p2').tap();
  for (const id of ['bb-waterbending', 'bb-allies', 'bb-spells']) await page.getByTestId(`packet-p2-${id}`).tap();
  await page.getByTestId('start').tap();
  await page.getByTestId('play-first').tap();
  const b = (await page.getByTestId('look').boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
  await page.waitForTimeout(700);
  await expect(page.getByTestId('tip')).toHaveText('Take the phone and show your hand, to act.');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(400);
  await expect(page.getByTestId('tip')).toHaveCount(0);
  await expect(page.getByTestId('handoff')).toBeVisible(); // Look was not pressed
  await page.getByTestId('look').tap(); // a tap still presses it
  await expect(page.getByTestId('keep')).toBeVisible();
});

/** Holds a finger on a locator's left strip for `ms`, then lifts. */
async function longPress(page: Page, l: ReturnType<Page['locator']>, ms = 700) {
  const b = (await l.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + 10, y: b.y + b.height / 2 }] });
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
}

test('a long press on any card opens its full view; the log icon opens and closes the log', async ({ page }) => {
  await toLawrencesTurn(page);
  // in hand: the view opens, and nothing is cast or played
  const hand = await page.locator('.hand .card').count();
  await longPress(page, page.locator('.hand .card').first());
  await expect(page.getByTestId('card-view')).toBeVisible();
  await page.getByTestId('close-view').tap();
  await expect(page.locator('.hand .card')).toHaveCount(hand);
  // a land in play, on the lands strip
  await page.getByTestId('handcard-Mountain').first().tap();
  await page.getByTestId('action-play').tap();
  await longPress(page, page.getByTestId('lands-p1').locator('.chip').first());
  await expect(page.getByTestId('full-img')).toHaveAttribute('alt', 'Mountain');
  await page.getByTestId('close-view').tap();
  // the log: one icon opens and closes it
  await page.getByTestId('log-button').tap();
  await expect(page.getByTestId('log')).toContainText('Player 1 plays Mountain');
  await page.getByTestId('log-button').tap();
  await expect(page.getByTestId('log')).toHaveCount(0);
});
