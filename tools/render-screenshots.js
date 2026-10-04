/* README screenshots, taken from the built site (docs/screenshots/*.png, 1280×800, light theme).
   Starts tools/serve.js itself. Needs Playwright with Chromium (or PW_CHANNEL=msedge|chrome).
   Usage: node tools/render-screenshots.js */
'use strict';
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require('@playwright/test');
const PORT = 4174, BASE = `http://localhost:${PORT}/power-bi/`;
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

/* a learner partway through, so progress has something to show (fictional, like everything else) */
const PROGRESS = { schemaVersion: 3, done: {}, quiz: {}, quizFirst: {}, seen: {}, xp: {
  s01: { st: 'done', done: true, hints: 1, del: { req: true, kpi: true }, rub: {}, notes: '' }, d01: { st: 'done', done: true, hints: 0, del: {}, rub: {}, notes: '' },
  s04: { st: 'active', hints: 1, del: {}, rub: {}, notes: '' } } };

const SHOTS = [
  ['home', 'index.html', null],
  ['skill-mode', 'beginner.html', null],
  ['experience-mode', 'experience/s04-monday-performance-incident.html', 'empty'],
  ['toolkit', 'toolkit.html', null],
  ['progress', 'progress.html', 'progress']
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn(process.execPath, [path.join(__dirname, 'serve.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  try {
    for (const [name, url, state] of SHOTS) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', serviceWorkers: 'block', deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      /* seed once per page session (the reload below must keep what was added) */
      if (state) await page.addInitScript(([s, p]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear();
        if (s === 'progress') localStorage.setItem('pbi-holy-grail-v1', JSON.stringify(p)); }, [state, PROGRESS]);
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      if (state === 'progress') {
        await page.evaluate(() => {
          const st = JSON.parse(localStorage.getItem('pbi-holy-grail-v1'));
          MODULES.filter(m => m.id === 'beginner').forEach(m => m.topics.forEach(t => t.g.forEach((_, i) => { if (i < 3) st.done[t.id + '-' + i] = true; })));
          MODULES.filter(m => m.id === 'beginner').forEach(m => m.topics.forEach(t => t.mcq.forEach((a, i) => { if (a !== null && i % 3 !== 2) { st.quiz[t.id + '-q' + i] = a; st.quizFirst[t.id + '-q' + i] = a; } })));
          for (const id of ['s01', 'd01']) { const s = SCENARIO_INDEX.find(x => x.id === id); s.rubric.forEach((r, k) => st.xp[id].rub[r.id] = k % 2 ? 3 : 2); }
          localStorage.setItem('pbi-holy-grail-v1', JSON.stringify(st));
        });
        await page.reload({ waitUntil: 'networkidle' });
        await page.locator('#stages').scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollTo(0, document.getElementById('evidence').offsetTop - 80));
      }
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, name + '.png') });
      console.log('wrote docs/screenshots/' + name + '.png');
      await ctx.close();
    }
  } finally { await browser.close(); server.kill(); }
})();
