/* Critical learner journeys, end to end, against the generated site. If one of these breaks, CI fails and the
   site is not deployed. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { test, expect, seed, read } = require('./fixtures');

test('new learner: home → goal → route → first step', async ({ page }) => {
  await seed(page, {});
  await page.goto('index.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn Power BI');
  await expect(page.locator('#cta .btn.primary')).toBeVisible();
  await page.locator('#goals button').first().click();
  const first = page.locator('#route .route li a').first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute('href');
  await first.click();
  await expect(page).toHaveURL(new RegExp(href.replace(/[.#?]/g, m => '\\' + m) + '$'));
  expect((await read(page)).main.goal).toBeTruthy();
});

test('Skill Mode: tick an assignment, answer a quiz, open a solution, see it on Progress', async ({ page }) => {
  await seed(page, {});
  await page.goto('beginner.html');
  const topic = page.locator('article.topic').first();
  const box = topic.locator('.asg input[type=checkbox]').first();
  await box.check();
  await expect(box).toBeChecked();
  await topic.getByRole('tab', { name: /Assessment/ }).click();
  const quiz = topic.locator('.quiz[data-q]').first();
  const right = await quiz.getAttribute('data-a');
  await quiz.locator(`input[value="${right}"]`).check({ force: true });
  await expect(quiz).toHaveClass(/answered/);
  await topic.getByRole('tab', { name: /Assignments/ }).click();
  const sol = topic.locator('details.sol').nth(1);
  await sol.locator('summary').click();
  const reveal = sol.locator('[data-reveal]');
  if (await reveal.count()) await reveal.click();
  await expect(sol.locator('.solbody')).toBeVisible();
  const st = (await read(page)).main;
  const qid = await quiz.getAttribute('data-q');
  expect(st.quizFirst[qid]).toBe(+right);
  await page.goto('progress.html');
  await expect(page.locator('#evidence')).toContainText('1/103');
  await expect(page.locator('#evidence')).toContainText(/1\s*\/\s*151/);
});

test('Experience Mode: take the ticket, evidence, hint, note, rubric, finish, progress', async ({ page }) => {
  await seed(page, {});
  await page.goto('experience/s01-executive-sales-dashboard.html');
  await expect(page.locator('body')).not.toHaveClass(/xpfocus/);
  await page.getByRole('button', { name: 'Take the ticket' }).click();
  await expect(page.locator('body')).toHaveClass(/xpfocus/);
  await expect(page.getByRole('tab', { name: /Evidence/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#pane-evidence article.ev').first()).toBeVisible();
  await page.getByRole('tab', { name: /Hints/ }).click();
  await page.locator('#hintBtn').click();
  await expect(page.locator('.hints li.shown')).toHaveCount(1);
  await page.getByRole('tab', { name: /Your work/ }).click();
  await page.locator('#notes').fill('Duplicates in the export; the test account must go.');
  await page.getByRole('tab', { name: /Finish and review/ }).click();
  const criteria = page.locator('fieldset.rb');
  const n = await criteria.count();
  for (let i = 0; i < n; i++) await criteria.nth(i).locator('input[value="3"]').check({ force: true });
  await expect(page.locator('.scorebox')).toContainText(/Outcome\s*75%/i);
  await expect(page.locator('.scorebox')).toContainText(/Independence\s*90%/i);
  await page.locator('#finishBtn').click();
  await expect(page.locator('body')).not.toHaveClass(/xpfocus/);
  await page.waitForTimeout(500);                       /* notes are saved after a short pause */
  const rec = (await read(page)).main.xp.s01;
  expect(rec.done).toBe(true);
  expect(rec.notes).toContain('Duplicates');
  expect(rec.hints).toBe(1);
  await page.goto('progress.html');
  const row = page.locator('#experience tr', { hasText: 'Executive sales dashboard' });
  await expect(row).toContainText('Done');
  await expect(row).toContainText('75%');
  await expect(row).toContainText('90%');
});

test('flashcards: reveal, grade, next, and the schedule survives a reload', async ({ page }) => {
  await seed(page, {}, {});
  await page.goto('flashcards.html');
  const first = await page.locator('#card .front .q').textContent();
  await page.getByRole('button', { name: 'Show answer' }).click();
  await expect(page.locator('#card')).toHaveClass(/flipped/);
  await expect(page.getByRole('button', { name: 'Show question' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#gotBtn').click();
  await page.locator('#nextBtn').click();
  await expect(page.locator('#card .front .q')).not.toHaveText(first);
  const srs = (await read(page)).cards.srs;
  expect(Object.values(srs).filter(r => r.b === 1)).toHaveLength(1);
  await page.reload();
  expect(Object.keys((await read(page)).cards.srs)).toHaveLength(1);
});

test('search: open with /, type, pick a result', async ({ page }) => {
  await page.goto('learn.html');
  await page.locator('body').press('/');
  const input = page.locator('#srchInput');
  await expect(input).toBeFocused();
  await input.fill('CALCULATE');
  const item = page.locator('.srch-item').first();
  await expect(item).toBeVisible();
  const href = await item.getAttribute('href');
  await input.press('Enter');
  await expect(page).toHaveURL(new RegExp(href.split('#')[0].replace(/^.*\//, '').replace(/\./g, '\\.')));
});

test('returning learner: start from the beginning asks first, then clears progress and keeps a backup', async ({ page }) => {
  await seed(page, { schemaVersion: 3, done: { 'b-pq-0': true }, quiz: {}, quizFirst: {}, xp: {}, seen: {} }, { srs: {} });
  await page.goto('index.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pick up where you left off.');
  const btn = page.getByRole('button', { name: 'Start from the beginning' });
  await expect(btn).toBeVisible();
  page.once('dialog', d => d.dismiss());
  await btn.click();
  expect(Object.keys((await read(page)).main.done || {}).length).toBe(1);
  page.once('dialog', d => d.accept());
  await btn.click();
  await page.waitForLoadState('load');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn Power BI');
  expect((await read(page)).backup).toContain('b-pq-0');
});

test('progress: export, reset, import, restored', async ({ page }) => {
  const main = { schemaVersion: 3, done: { 'b-pq-0': true, 'b-pq-1': true }, quiz: {}, quizFirst: {}, xp: { s01: { st: 'done', done: true, hints: 0, del: {}, rub: { acc: 4 }, notes: 'kept' } }, seen: {} };
  await seed(page, main, { srs: {} });
  await page.goto('progress.html');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#app [data-export]').click()]);
  const file = path.join(os.tmpdir(), `pbi-progress-${Date.now()}.json`);
  await dl.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(exported.app).toBe('power-bi-holy-grail');
  expect(exported.version).toBe(3);

  page.once('dialog', d => d.accept());
  await page.locator('#resetAll').click();
  await page.waitForLoadState('load');
  await expect.poll(async () => Object.keys((await read(page)).main.done || {}).length).toBe(0);

  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#app [data-import]').click()]);
  await chooser.setFiles(file);
  const dlg = page.locator('dialog.dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText(/Assignments ticked\s*2\s*0/);
  await dlg.getByRole('button', { name: 'Replace' }).click();
  await expect.poll(async () => (await read(page)).main.done['b-pq-1']).toBe(true);
  expect((await read(page)).main.xp.s01.notes).toBe('kept');
  fs.unlinkSync(file);
});

test('Toolkit: search, filter, open a guide', async ({ page }) => {
  await page.goto('toolkit.html');
  await page.locator('#tkq').fill('report is slow');
  await page.locator('#tkq').press('Enter');
  await expect(page.locator('#tkresults')).toBeVisible();
  await expect(page.locator('#tkresults a').first()).toBeVisible();
  const stage = page.locator('select[data-f="stage"]');
  if (!(await stage.isVisible())) await page.getByText(/Filter by/).first().click();   /* filters sit in a disclosure */
  await stage.selectOption('senior');
  await expect(page).toHaveURL(/stage=senior/);
  const guide = page.locator('#tkresults a[href*="toolkit/"]').first();
  const href = await guide.getAttribute('href');
  await guide.click();
  await expect(page).toHaveURL(new RegExp(href.replace(/\./g, '\\.').replace(/#.*$/, '')));
  await expect(page.locator('h1')).toHaveCount(1);
});

test.describe('theme', () => {
  test('follows the system setting when none is saved', async ({ browser }) => {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ colorScheme: scheme, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.goto('index.html');
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe(scheme === 'dark' ? 'rgb(13, 15, 18)' : 'rgb(247, 247, 244)');
      await ctx.close();
    }
  });
  test('the switch overrides it and is remembered', async ({ page }) => {
    await seed(page, {});
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('index.html');
    const sw = page.locator('[data-theme-toggle]');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto('learn.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-checked', 'true');
  });
});

test('phone navigation: four tabs and More', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('glossary.html');
  const visible = await page.locator('.mainnav > a:visible').allTextContents();
  expect(visible).toEqual(['Learn', 'Experience', 'Interview', 'Toolkit']);
  const more = page.locator('.navmore summary');
  await expect(more).toHaveClass(/cur/);
  await more.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.navmenu')).toBeVisible();
  await expect(page.locator('.navmenu a[aria-current="page"]')).toHaveText('Glossary');
  await page.keyboard.press('Escape');
  await expect(page.locator('.navmenu')).toBeHidden();
  await expect(more).toBeFocused();
  await more.click();
  await page.locator('.navmenu a', { hasText: 'Library' }).click();
  await expect(page).toHaveURL(/resources\.html$/);
});
