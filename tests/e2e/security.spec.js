/* The Content Security Policy actually blocks injected script, and a hostile progress file can't run code or
   create an external link through the real import flow. */
'use strict';
const { test: base, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const { PAGES } = require('./fixtures');

for (const p of [...PAGES, 'glossary.html', 'resources.html']) {
  base(`CSP blocks injected inline script: ${p}`, async ({ page }) => {
    await page.goto(p);
    const r = await page.evaluate(() => new Promise(res => {
      let blocked = false;
      document.addEventListener('securitypolicyviolation', e => { if (e.violatedDirective.startsWith('script-src')) blocked = true; });
      const s = document.createElement('script'); s.textContent = 'window.__pwned = 1'; document.head.appendChild(s);
      const img = document.createElement('div'); img.innerHTML = '<img src="x" onerror="window.__pwned2 = 1">'; document.body.appendChild(img);
      setTimeout(() => res({ blocked, pwned: window.__pwned, pwned2: window.__pwned2 }), 300);
    }));
    expect(r.pwned, 'inline script ran').toBeUndefined();
    expect(r.pwned2, 'inline event handler ran').toBeUndefined();
    expect(r.blocked, 'violation reported').toBe(true);
  });
}

base('a hostile progress file imported through the UI cannot run script or add an external link', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  await page.goto('progress.html');
  const evil = { app: 'power-bi-holy-grail', version: 3, exported: '2026-10-01T09:30:00.000Z', data: {
    'pbi-holy-grail-v1': { schemaVersion: 3, done: { 'b-pq-0': true }, last: { href: 'javascript:alert(1)', title: '<img src=x onerror=alert(2)>', at: '2026-10-01T09:30:00.000Z' },
      diag: { at: '2026-10-01T09:30:00.000Z', rec: { label: '<script>alert(3)</script>', href: 'https://evil.example/' } }, xp: { s01: { done: true, notes: '<img src=x onerror=alert(4)>' } } },
    'pbi-holy-grail-cards-v1': { srs: {} } } };
  const f = path.join(os.tmpdir(), `evil-${Date.now()}.json`); fs.writeFileSync(f, JSON.stringify(evil));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#app [data-import]').click()]);
  await chooser.setFiles(f);
  await page.locator('dialog.dlg').getByRole('button', { name: 'Replace' }).click();
  await page.waitForTimeout(1200);
  for (const u of ['index.html', 'progress.html', 'experience/s01-executive-sales-dashboard.html']) {
    await page.goto(u); await page.waitForLoadState('networkidle');
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    expect(hrefs.filter(h => /^(javascript:|https?:\/\/evil)/i.test(h)), `${u}: hostile links`).toEqual([]);
  }
  expect(dialogs, 'no script ran (no alert)').toEqual([]);
  fs.unlinkSync(f);
});
