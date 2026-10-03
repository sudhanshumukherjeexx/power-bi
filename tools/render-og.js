/* Renders tools/og/og.html to site/assets/og/og-default.png (1200×630), the image shared links preview with.
   Needs Playwright with a Chromium browser: npm install, then npx playwright install chromium.
   Usage: node tools/render-og.js */
'use strict';
const path = require('path'), fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is not installed. Run: npm install && npx playwright install chromium'); process.exit(1); }
(async () => {
  const src = path.join(__dirname, 'og', 'og.html');
  const out = path.join(__dirname, '..', 'site', 'assets', 'og', 'og-default.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + src.split(path.sep).join('/'));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('wrote', path.relative(process.cwd(), out));
})();
