/* Responsive layout at 1440, 1024, 768 and 390px in both themes. These are layout assertions, not pixel snapshots:
   pixel baselines differ between operating systems and font renderers and turn into noise. What breaks real layouts
   is checked directly: horizontal overflow, header controls overlapping, the navigation fitting, a primary action
   in reach, touch targets on phones. A full-page screenshot of every case is attached to the report for review. */
'use strict';
const { test, expect, seed, PAGES } = require('./fixtures');
const WIDTHS = [1440, 1024, 768, 390];
const overlap = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const scheme of ['light', 'dark']) {
  for (const w of WIDTHS) {
    test.describe(`${w}px ${scheme}`, () => {
      test.use({ viewport: { width: w, height: 900 }, colorScheme: scheme });
      for (const p of PAGES) {
        test(p, async ({ page }, info) => {
          await seed(page, {});
          await page.goto(p);
          await page.waitForLoadState('networkidle');
          const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(over, 'no horizontal page scroll').toBeLessThanOrEqual(0);

          /* header controls never overlap */
          const boxes = await Promise.all(['.brand', '[data-open-search]', '[data-theme-toggle]'].map(s => page.locator(s).first().boundingBox()));
          for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j]), 'header controls overlap').toBeFalsy();
          const nav = await page.locator('.mainnav').boundingBox();
          if (nav) expect(nav.x + nav.width, 'navigation fits the viewport').toBeLessThanOrEqual(w + 1);

          /* nothing in main sticks out of the viewport (tables and code scroll inside their own box) */
          const wide = await page.$$eval('main *', (els, vw) => {
            /* content inside a box that scrolls sideways (tabs, chip rows, tables, code) is meant to extend past it */
            const inScroller = e => { for (let a = e.parentElement; a && a.tagName !== 'MAIN'; a = a.parentElement) if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(a).overflowX)) return true; return false; };
            return els.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && !inScroller(e); }).slice(0, 3).map(e => e.tagName + '.' + e.className);
          }, w);
          expect(wide, 'elements wider than the viewport').toEqual([]);

          if (w === 390) {
            const small = await page.$$eval('.mainnav > a, .navmore > summary, .btn.primary', els => els.filter(e => e.offsetParent && e.getBoundingClientRect().height < 44).map(e => e.textContent.trim()));
            expect(small, 'touch targets of at least 44px').toEqual([]);
          }
          await info.attach(`${p} ${w} ${scheme}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
        });
      }
    });
  }
}
