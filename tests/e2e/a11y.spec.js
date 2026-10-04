/* Accessibility as a CI gate: axe-core finds no serious or critical issues on the representative pages in either
   theme, and the keyboard paths a learner depends on work. */
'use strict';
const AxeBuilder = require('@axe-core/playwright').default;
const { test, expect, seed, PAGES } = require('./fixtures');

/* a learner partway through, so progress, readiness and scenario state are on screen too */
const MID = { schemaVersion: 3, done: { 'b-pq-0': true }, quiz: {}, quizFirst: {}, xp: { s04: { st: 'active', started: '2026-10-01T10:00:00.000Z', hints: 1, del: {}, rub: {}, notes: '' } }, seen: {},
  last: { href: 'experience/s04-monday-performance-incident.html', title: 'INC-2044', at: '2026-10-02T10:00:00.000Z' } };

for (const scheme of ['light', 'dark']) {
  test.describe(`axe, ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    for (const p of PAGES) {
      test(p, async ({ page }) => {
        await seed(page, MID, { srs: {} });
        await page.goto(p);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(200);                 /* scroll regions are labelled after layout settles */
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        const bad = r.violations.filter(v => ['serious', 'critical'].includes(v.impact));
        expect(bad.map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      });
    }
  });
}

test('every page has exactly one h1 and labelled form fields', async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    await expect(page.locator('h1'), p).toHaveCount(1);
    const unlabelled = await page.$$eval('input:not([type=hidden]),select,textarea', els => els.filter(e => e.offsetParent !== null && !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map(e => e.outerHTML.slice(0, 80)));
    expect(unlabelled, p).toEqual([]);
  }
});

test('keyboard: skip link, visible focus', async ({ page }) => {
  await page.goto('learn.html');
  await page.keyboard.press('Tab');
  const skip = page.locator('a.skip');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#app')).toBeFocused();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 || s.boxShadow !== 'none'; });
    expect(ring, 'focused element shows a focus indicator').toBe(true);
  }
});

test('keyboard: search dialog traps focus, Escape closes and returns focus', async ({ page }) => {
  await page.goto('toolkit.html');
  const opener = page.locator('[data-open-search]');
  await opener.focus();
  await page.keyboard.press('Enter');
  const dlg = page.getByRole('dialog', { name: 'Search' });
  await expect(dlg).toBeVisible();
  await expect(page.locator('#srchInput')).toBeFocused();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('.srch')), 'focus stays inside the dialog').toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(opener).toBeFocused();
});

test('keyboard: Skill Mode topic tabs follow the tab pattern', async ({ page }) => {
  await page.goto('beginner.html');
  const tabs = page.locator('article.topic').first().getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`#${await tabs.nth(1).getAttribute('aria-controls')}`)).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');
});

test('keyboard: scenario tabs, hints and the flashcard', async ({ page }) => {
  await page.goto('experience/s02-finance-disputes-revenue.html');
  const brief = page.getByRole('tab', { name: 'Brief' });
  await brief.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Evidence/ })).toBeFocused();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Hints/ })).toHaveAttribute('aria-selected', 'true');
  await page.locator('#hintBtn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hints li.shown')).toHaveCount(1);

  await page.goto('flashcards.html');
  await page.getByRole('button', { name: 'Show answer' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#card .back')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#card .front')).toHaveAttribute('inert', '');
});

test('reduced motion: no transitions or animations', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto('flashcards.html');
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('#card .flip')).transitionDuration);
  expect(d.split(',').every(x => parseFloat(x) === 0)).toBe(true);
  await ctx.close();
});
