/* External resource catalog (content/resources/external.json): every entry is complete, https, untracked and
   unique; categories, stages, lessons and scenarios resolve; the generated script carries every entry; and the
   pages that show it load it. */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('../tools/lib/load');
const { check } = require('../tools/lib/build-external');
const { root } = require('./lib/util');

module.exports = t => {
  const all = load.all();
  const x = all.external;
  if (!t.ok(x, 'content/resources/external.json is missing')) return;
  for (const e of check(x, all)) t.ok(false, e);
  t.ok(x.items.length >= 100, `expected the full catalog (100+ entries), found ${x.items.length}`);
  t.ok(/^\d{4}-\d{2}-\d{2}$/.test(x.verified && x.verified.date), 'external.json needs verified.date');
  const official = x.items.filter(i => i.src === 'official').length;
  t.ok(official / x.items.length > 0.6, `official documentation should be the backbone (${official} of ${x.items.length} entries are official)`);

  const js = fs.readFileSync(path.join(root, 'assets/js/external.js'), 'utf8');
  const EXTERNAL = new Function(js + ';return EXTERNAL;')();
  t.eq(EXTERNAL.items.length, x.items.length, 'assets/js/external.js entries');
  for (const s of all.scenarios || []) {
    const html = fs.readFileSync(path.join(root, `experience/${s.slug}.html`), 'utf8');
    t.ok(html.includes('assets/js/external.js'), `experience/${s.slug}.html doesn't load external.js`);
  }
  for (const f of ['resources.html', 'beginner.html', 'sql.html']) t.ok(fs.readFileSync(path.join(root, f), 'utf8').includes('assets/js/external.js'), `${f} doesn't load external.js`);
  /* Sprint 04 gets the performance reading list the scenario needs */
  const s04 = EXTERNAL.items.filter(i => i.s.some(s => s[0] === 's04')).map(i => i.t);
  for (const want of ['Performance Analyzer', 'DAX Studio: Server Timings', 'Execution plans', 'Optimization guide for Power BI'])
    t.ok(s04.includes(want), `Sprint 04's "Need more context?" is missing ${want}`);
};
