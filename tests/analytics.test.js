/* The analytics loader (site/assets/js/analytics.js) only loads Cloudflare's beacon when it may: a configured token,
   https, no opt-out, no Do Not Track / Global Privacy Control, no search text in the address. Runs the real file in
   a VM with a fake page. Also: with no token configured (the default) no page references analytics at all. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { site, walk, rel } = require('./lib/util');
const P = require('../tools/lib/partials');

const SRC = fs.readFileSync(path.join(site, 'assets/js/analytics.js'), 'utf8');
const TOKEN = '0123456789abcdef0123456789abcdef';
function run({ meta = `cloudflare:${TOKEN}`, href = 'https://sudhanshumukherjeexx.github.io/power-bi/beginner.html', optOut = false, gpc = false, dnt = '0' } = {}) {
  const added = [], u = new URL(href);
  const store = new Map(optOut ? [['pbi-analytics-off', '1']] : []);
  const doc = { querySelector: s => s === 'meta[name="pbi-analytics"]' && meta ? { getAttribute: () => meta } : null,
    createElement: () => ({ setAttribute(k, v) { this[k] = v; } }), head: { appendChild: el => added.push(el) } };
  vm.runInNewContext(SRC, { document: doc, location: { hostname: u.hostname, protocol: u.protocol, hash: u.hash, search: u.search },
    navigator: { globalPrivacyControl: gpc, doNotTrack: dnt }, window: {}, localStorage: { getItem: k => store.get(k) || null }, JSON });
  return added;
}

module.exports = t => {
  const ok = run();
  t.eq(ok.length, 1, 'loads the beacon when allowed');
  t.eq(ok[0] && ok[0].src, 'https://static.cloudflareinsights.com/beacon.min.js', 'loads only Cloudflare\'s beacon');
  t.ok(ok[0] && JSON.parse(ok[0]['data-cf-beacon']).spa === false, 'counts page loads only (no in-page navigation tracking)');
  t.eq(run({ optOut: true }).length, 0, 'opt-out on the progress page is respected');
  t.eq(run({ gpc: true }).length, 0, 'Global Privacy Control is respected');
  t.eq(run({ dnt: '1' }).length, 0, 'Do Not Track is respected');
  t.eq(run({ href: 'http://localhost:4173/power-bi/' }).length, 0, 'never on a local preview');
  t.eq(run({ href: 'https://127.0.0.1/power-bi/' }).length, 0, 'never on 127.0.0.1');
  t.eq(run({ href: 'https://x.github.io/power-bi/toolkit.html#q=my%20boss%20name' }).length, 0, 'never on a page whose address carries a search');
  t.eq(run({ meta: null }).length, 0, 'nothing without the meta tag');
  t.eq(run({ meta: 'cloudflare:not-a-token' }).length, 0, 'nothing with a malformed token');

  /* the default build: no token, so no page mentions analytics and no third-party host is allowed */
  if (!P.analytics()) for (const f of walk(site, p => p.endsWith('.html'))) {
    const h = fs.readFileSync(f, 'utf8');
    t.ok(!/pbi-analytics|analytics\.js|cloudflareinsights/.test(h), `${rel(f)}: references analytics although none is configured`);
  }
};
