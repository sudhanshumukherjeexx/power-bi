/* BI Developer Toolkit: every guide's metadata is valid and its references resolve (tools/lib/toolkit.js check()),
   every guide and door page is generated with the shared navigation, the hub index covers every guide and every
   role, downloads exist, links carry no tracking parameters, and external references use https. */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('../tools/lib/load');
const { check } = require('../tools/lib/toolkit');
const { site } = require('./lib/util');

module.exports = t => {
  const all = load.all();
  const tk = all.toolkit;
  if (!t.ok(tk, 'content/toolkit is missing')) return;
  for (const e of check(tk, all)) t.ok(false, e);

  t.ok(tk.doors.length === 7, `the hub shows seven doors (six plus the Library), found ${tk.doors.length}`);
  t.ok(tk.doors.some(d => d.id === 'library' && d.href === 'resources.html'), 'the Library door opens resources.html');
  t.ok(tk.guides.length >= 25, `expected at least 25 guides, found ${tk.guides.length}`);

  const read = rel => { const f = path.join(site, rel); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
  const hub = read('toolkit.html');
  if (t.ok(hub, 'toolkit.html is not generated')) {
    for (const d of tk.doors) t.ok(hub.includes(`href="${d.href || `toolkit/${d.id}.html`}"`), `toolkit.html: no door link to ${d.id}`);
    t.ok(/id="tkq"/.test(hub) && /What are you trying to do\?/.test(hub), 'toolkit.html: the search box is missing');
    for (const f of ['skill', 'stage', 'tool', 'problem', 'certification']) t.ok(hub.includes(`data-f="${f}"`), `toolkit.html: the ${f} filter is missing`);
  }
  for (const d of tk.doors.filter(x => !x.href)) {
    const html = read(`toolkit/${d.id}.html`);
    if (!t.ok(html, `toolkit/${d.id}.html is not generated`)) continue;
    for (const g of tk.guides.filter(x => x.door === d.id)) t.ok(html.includes(`toolkit/${g.id}.html`), `door ${d.id} doesn't list ${g.id}`);
  }
  for (const g of tk.guides) {
    const html = read(`toolkit/${g.id}.html`);
    if (!t.ok(html, `toolkit/${g.id}.html is not generated`)) continue;
    t.ok(html.includes('<!--nav:toolkit-->') && html.includes('aria-current="true">Toolkit<'), `toolkit/${g.id}.html: Toolkit tab is not current`);
    t.ok(!/:::\s*[\w-]+/.test(html), `toolkit/${g.id}.html: an unrendered ::: macro is left in the page`);
    t.ok(!/utm_[a-z]+=/.test(html), `toolkit/${g.id}.html: tracking parameters in links`);
    t.ok(/class="verified"/.test(html), `toolkit/${g.id}.html: no "checked" date shown`);
    if (g.download) t.ok(read(`toolkit/${g.id}.md`), `toolkit/${g.id}.md download is missing`);
    for (const f of g.files || []) t.ok(read(`toolkit/files/${f.name}`), `toolkit/files/${f.name} download is missing`);
    for (const r of g.refs || []) t.ok(!/learn\.microsoft\.com\/(?!en-us\/)/.test(r.u), `${g._file}: Microsoft Learn link without /en-us/: ${r.u}`);
  }

  /* the hub's index: every guide, and every role a learner might need, is findable */
  const js = read('assets/js/toolkit.js');
  if (t.ok(js, 'assets/js/toolkit.js is not generated')) {
    const TOOLKIT = new Function(js + ';return TOOLKIT;')();
    const hrefs = new Set(TOOLKIT.items.map(i => i[4]));
    for (const g of tk.guides) t.ok(hrefs.has(`toolkit/${g.id}.html`), `toolkit index: ${g.id} is missing`);
    for (const [role] of TOOLKIT.roles) t.ok(TOOLKIT.items.some(i => i[0] === role), `toolkit index: no item has role "${role}"`);
    /* "my report is slow" must lead to the troubleshooting tree, a lesson, a scenario and the performance checklist */
    /* tkhub.js maps "slow" to "performance" */
    const hits = TOOLKIT.items.filter(i => /slow|performance/.test((i[1] + ' ' + i[2] + ' ' + i[3]).toLowerCase()));
    for (const want of ['toolkit/performance-clinic.html', 'advanced.html#a-perf', 'experience/s04-monday-performance-incident.html'])
      t.ok(hits.some(i => i[4].startsWith(want)), `toolkit index: a search for "slow" doesn't reach ${want}`);
  }
  const search = read('assets/js/search-index.js') || '';
  t.ok(search.includes('"Toolkit"'), 'site search has no Toolkit entries');
};
