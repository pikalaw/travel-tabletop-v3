import { test, expect } from '@playwright/test';

test('the home screen loads with its version and no errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Travel Tabletop v3' })).toBeVisible();
  await expect(page.locator('.version')).toHaveText(/^v\d+\.\d+\.\d+ · \w+$/);
  expect(errors).toEqual([]);
});

test('the home screen counts the bundled pool, and card images are served', async ({ page, request }) => {
  await page.goto('./');
  await expect(page.locator('.pool')).toHaveText('Card pool: 76 packets, 343 cards, 11 tokens.');
  const res = await request.get('cards/9a13a622517019c3d4e853417b892942046f81637500f7e99bad2542224902bb.jpg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/jpeg');
});
