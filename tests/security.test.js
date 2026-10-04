/* Every page carries a Content Security Policy that comes before any script, never allows inline script or eval,
   lists exactly the hashes of the page's own inline scripts, and allows no third-party host unless analytics is
   configured. Plus the repository basics: no secret-looking strings in tracked text. */
'use strict';
const fs = require('fs'), crypto = require('crypto'), path = require('path');
const { root, site, walk, rel } = require('./lib/util');
const P = require('../tools/lib/partials');

module.exports = t => {
  const cf = P.analytics();
  for (const f of walk(site, p => p.endsWith('.html'))) {
    const html = fs.readFileSync(f, 'utf8'), r = rel(f);
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
    if (!t.ok(m, `${r}: no Content-Security-Policy`)) continue;
    const csp = m[1], firstScript = html.search(/<script\b/);
    t.ok(firstScript < 0 || m.index < firstScript, `${r}: the CSP must come before the first script`);
    const script = (csp.match(/script-src ([^;]*)/) || [])[1] || '';
    t.ok(!/'unsafe-inline'|'unsafe-eval'|\*/.test(script), `${r}: script-src must not allow inline script, eval or wildcards`);
    t.ok(/default-src 'self'/.test(csp) && /object-src 'none'/.test(csp) && /base-uri 'self'/.test(csp), `${r}: default-src, object-src and base-uri locked down`);
    const want = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter(x => !/ld\+json/.test(x[1])).map(x => `'sha256-${crypto.createHash('sha256').update(x[2], 'utf8').digest('base64')}'`);
    const have = script.match(/'sha256-[^']+'/g) || [];
    t.eq(have.sort().join(' '), want.sort().join(' '), `${r}: CSP hashes must match the page's inline scripts`);
    const hosts = (csp.match(/https:\/\/[^\s;]+/g) || []);
    t.ok(hosts.every(h => cf && /cloudflareinsights\.com$/.test(h)), `${r}: unexpected third-party host in CSP: ${hosts.join(', ')}`);
    t.ok(!/\son[a-z]+="/i.test(html), `${r}: inline event handler attribute (blocked by the CSP anyway)`);
  }
  /* no secrets in tracked text files */
  const SECRET = /(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})/;
  for (const f of walk(root, p => /\.(js|json|md|yml|yaml|html|txt|py|sql|env)$/.test(p) && !/[\\/](node_modules|\.git|test-results|playwright-report)[\\/]/.test(p))) {
    t.ok(!SECRET.test(fs.readFileSync(f, 'utf8')), `${rel(f)}: looks like it contains a secret`);
  }
};
