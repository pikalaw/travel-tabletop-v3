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
