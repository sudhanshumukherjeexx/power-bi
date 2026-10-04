/* Shared fixtures for the browser tests.
   - every test fails if the page logs a JavaScript error or an error to the console
   - seed(page, main, cards) writes progress into localStorage before the first page script runs */
'use strict';
const base = require('@playwright/test');

const test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror ${page.url()}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_ABORTED/.test(m.text())) errors.push(`console ${page.url()}: ${m.text()}`); });
    await use(page);
    if (errors.length && testInfo.status === testInfo.expectedStatus) throw new Error('Page errors:\n' + errors.join('\n'));
  }
});

const KEYS = { main: 'pbi-holy-grail-v1', cards: 'pbi-holy-grail-cards-v1', backup: 'pbi-holy-grail-backup-v1' };
async function seed(page, main, cards) {
  await page.addInitScript(([K, m, c]) => {
    if (sessionStorage.getItem('seeded')) return;      /* seed once per test, so reloads keep what the test did */
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    if (m) localStorage.setItem(K.main, JSON.stringify(m));
    if (c) localStorage.setItem(K.cards, JSON.stringify(c));
  }, [KEYS, main || null, cards || null]);
}
const read = page => page.evaluate(K => ({ main: JSON.parse(localStorage.getItem(K.main) || '{}'), cards: JSON.parse(localStorage.getItem(K.cards) || '{}'), backup: localStorage.getItem(K.backup) }), KEYS);

/* representative pages from the brief */
const PAGES = ['index.html', 'learn.html', 'beginner.html', 'experience.html', 'experience/s04-monday-performance-incident.html', 'toolkit.html', 'toolkit/dax-debugging.html', 'progress.html', 'flashcards.html'];

module.exports = { test, expect: base.expect, seed, read, KEYS, PAGES };
