/* Content Security Policy for every page, as a <meta> tag (GitHub Pages can't send headers).
   Scripts run only from this site, plus each page's own inline scripts allowed by their SHA-256 hash, so injected
   markup can't execute. Styles allow inline (progress bars set their width in a style attribute). If Cloudflare Web
   Analytics is configured in content/site.json, its beacon host is allowed too, and nothing else is.
   Not possible from a meta tag: frame-ancestors (clickjacking) and report-uri; see docs/security-audit.md. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const P = require('./partials');

function policy(html) {
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(m => !/type="application\/ld\+json"/.test(m[1]))
    .map(m => `'sha256-${crypto.createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  const cf = P.analytics();
  return [
    "default-src 'self'",
    `script-src 'self'${hashes.length ? ' ' + hashes.join(' ') : ''}${cf ? ' https://static.cloudflareinsights.com' : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${cf ? ' https://cloudflareinsights.com' : ''}`,
    "manifest-src 'self'", "worker-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"
  ].join('; ');
}
const META = /\n?<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
function apply(html) {
  html = html.replace(META, '');
  /* hash the page as it will be served (no CSP tag inside a script, so removing it first doesn't change hashes) */
  return html.replace(/(<meta charset="UTF-8">)/i, `$1\n<meta http-equiv="Content-Security-Policy" content="${policy(html)}">`);
}

module.exports = (all, ctx, out) => {
  const res = {};
  for (const [f, html] of Object.entries(out)) if (f.endsWith('.html') && /<meta charset="UTF-8">/i.test(html)) res[f] = apply(html);
  /* hand-written pages the build doesn't otherwise touch */
  for (const f of ['404.html']) {
    const p = path.join(all.siteDir, f);
    if (!res[f] && fs.existsSync(p)) res[f] = apply(fs.readFileSync(p, 'utf8'));
  }
  return res;
};
module.exports.policy = policy;
