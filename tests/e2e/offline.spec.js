/* Offline, as promised and no further: after one visit the app shell works offline; a scenario's files work offline
   only after "Make available offline". Uses the real service worker (blocked in the other tests). */
'use strict';
const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'allow' });

const S04 = 'experience/s04-monday-performance-incident.html', S02 = 'experience/s02-finance-disputes-revenue.html';
const ok = (page, url) => page.evaluate(async u => { try { const r = await fetch(u); return r.ok; } catch (e) { return false; } }, url);

test('make a scenario available offline, then use it without a connection', async ({ page, context }) => {
  await page.goto(S04);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();                                                     /* now controlled by the service worker */
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  /* the install step precaches the app shell; wait for it before going offline */
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).some(k => k.startsWith('pbi-holy-grail-'))), { timeout: 20000 }).toBe(true);

  const ctl = page.locator('#offlineCtl');
  await expect(ctl).toContainText('Make available offline');
  await ctl.getByRole('button', { name: /Make available offline/ }).click();
  await expect(ctl).toContainText('Available offline');
  await expect(ctl).toContainText(/\d+ files saved on this device/);

  await page.goto('experience.html');
  await expect(page.locator(`a.xcard[href="${S04}"] .offline-chip`)).toHaveText('Offline');

  await context.setOffline(true);
  await page.goto(S04);
  await expect(page.locator('h1')).toContainText('18 seconds');
  expect(await ok(page, '../data/experience/s04/server_timings.csv'), 'evidence file offline').toBe(true);
  expect(await ok(page, '../assets/js/xp/s04.js'), 'model answer offline').toBe(true);
  await page.getByRole('tab', { name: /Evidence/ }).click();
  await page.locator('[data-preview$="server_timings.csv"]').click();
  await expect(page.locator('#ev-' + await page.locator('[data-preview$="server_timings.csv"]').evaluate(b => b.closest('article').id.slice(3)) + ' .ev-prev table')).toBeVisible();

  /* honest: a scenario that wasn't saved opens (the page is precached) but its files aren't there */
  await page.goto(S02);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('#offlineCtl')).toContainText('Make available offline');
  const evidence = await page.evaluate(() => SCENARIOS.s02.evidence.find(e => e.kind === 'file').file);
  expect(await ok(page, '../' + evidence), 'unsaved scenario file must not be available offline').toBe(false);

  await context.setOffline(false);
  await page.goto(S04);
  await page.locator('#offlineRemove').click();
  await expect(page.locator('#offlineCtl')).toContainText('Make available offline');
});
