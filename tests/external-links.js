/* Checks that every https:// reference in content/ still resolves. Informational (scheduled in CI, never
   blocks a merge): documentation moves, and a moved page is a prompt to re-verify the lesson it supports.
   Usage: node tests/external-links.js [--json] */
'use strict';
const fs = require('fs'), path = require('path');
const { walk, rel, root } = require('./lib/util');

const urls = new Map();
for (const f of walk(path.join(root, 'content'), p => /\.(json|md)$/.test(p))) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/https:\/\/[^\s"')<>\]]+/g)) {
    const u = m[0].replace(/[.,;:]+$/, '');
    if (/example\.com|northwind\.example|json-schema\.org|contoso|api\.powerbi\.com|login\.microsoftonline|<|\{/.test(u)) continue;
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(rel(f));
  }
}

(async () => {
  const bad = [];
  const list = [...urls.keys()];
  const check = async u => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'power-bi-holy-grail-link-check' }, signal: AbortSignal.timeout(20000) });
        return r.status;
      } catch (e) { if (attempt) return 'error: ' + e.message; }
    }
  };
  for (let i = 0; i < list.length; i += 8) {
    const batch = list.slice(i, i + 8);
    const res = await Promise.all(batch.map(check));
    batch.forEach((u, j) => { if (res[j] !== 200) bad.push({ url: u, status: res[j], in: [...urls.get(u)] }); });
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(bad, null, 2));
  else {
    console.log(`${list.length} external references checked, ${bad.length} not OK`);
    for (const b of bad) console.log(`  ${b.status}  ${b.url}\n        in ${b.in.join(', ')}`);
  }
  process.exit(bad.length ? 1 : 0);
})();
