/* Renders tools/og/og.html to site/assets/og/og-default.png (1200×630), the image shared links preview with, and
   docs/social-preview.png (1280×640), the image to upload in GitHub Settings → Social preview.
   Needs Playwright with a Chromium browser: npm install, then npx playwright install chromium.
   Usage: node tools/render-og.js */
'use strict';
const path = require('path'), fs = require('fs');
let chromium;
try { ({ chromium } = require('@playwright/test')); } catch (e) { console.error('Playwright is not installed. Run: npm install && npx playwright install chromium'); process.exit(1); }
(async () => {
  const src = path.join(__dirname, 'og', 'og.html');
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  for (const [w, h, out] of [[1200, 630, path.join(__dirname, '..', 'site', 'assets', 'og', 'og-default.png')], [1280, 640, path.join(__dirname, '..', 'docs', 'social-preview.png')]]) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('file://' + src.split(path.sep).join('/'));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out });
    console.log('wrote', path.relative(process.cwd(), out));
  }
  await browser.close();
})();
