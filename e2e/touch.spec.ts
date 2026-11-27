/** Touch: a tap opens a hand card's full view, and the tap's own click doesn't close it or press Cast. */
import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true });

test('a tap on a card in hand opens its full view and leaves it open', async ({ page }) => {
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
  for (const card of await page.locator('.hand .card').all()) {
    await card.tap();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('card-view')).toBeVisible();
    await expect(page.getByTestId('confirm')).toHaveCount(0);
    await page.getByTestId('close-view').tap();
    await expect(page.getByTestId('card-view')).toHaveCount(0);
  }
});
