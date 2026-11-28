/** Installable and offline (as v2): after one visit, the app and every card image work without the network. */
import { expect, test } from '@playwright/test';

test('after one visit the app works offline: reload, start a game, card images load', async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('./');
  await page.getByTestId('new-game').waitFor();
  // The service worker installs once it has stored the whole build, card images included.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  expect(await page.evaluate(async () => (await (await fetch('manifest.webmanifest')).json()).name)).toBe('Travel Tabletop v3');

  await context.setOffline(true);
  await page.reload();
  await page.getByTestId('new-game').click();
  for (const id of ['bb-firebending', 'bb-attacking', 'bb-zuko-tutorial']) await page.getByTestId(`packet-p1-${id}`).click();
  await page.getByTestId('tab-p2').click();
  for (const id of ['bb-waterbending', 'bb-allies', 'bb-spells']) await page.getByTestId(`packet-p2-${id}`).click();
  await page.getByTestId('start').click();
  await page.getByTestId('play-first').click();
  await page.getByTestId('look').click();
  await expect.poll(() => page.evaluate(() =>
    [...document.querySelectorAll('.hand img')].filter((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0).length,
  )).toBe(7);
});
