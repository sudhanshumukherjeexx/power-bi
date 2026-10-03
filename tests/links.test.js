/* Internal links: every relative href/src in HTML, scripts and content points at a file that exists,
   and every #anchor resolves to a static id in the target page or to an id the page renders from content. */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('../tools/lib/load');
const { root, site, walk, rel } = require('./lib/util');

module.exports = t => {
  const a = load.all();
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  /* ids that pages render at runtime from content */
  const dynamic = new Set();
  a.modules.forEach(m => m.topicsData.forEach(T => {
    dynamic.add(T.id);
    T.asg.forEach((_, i) => { dynamic.add(`${T.id}:asg:${i}`); dynamic.add(`${T.id}-${i}`); });
    T.int.forEach((_, i) => dynamic.add(`${T.id}:int:${i}`));
    T.ass.forEach((_, i) => dynamic.add(`${T.id}:ass:${i}`));
    ['asg', 'int', 'ass'].forEach(p => dynamic.add(`${T.id}:${p}`));
  }));
  a.datasets.forEach(d => dynamic.add('ds-' + d.key));
  a.glossary.forEach(g => dynamic.add(slug(g.t)));
  (a.dynamicIds || []).forEach(x => dynamic.add(x));
  /* section ids that page scripts render (levelpage.js, progresspage.js, experience.js, templates.js) */
  ['stages', 'competency', 'experience', 'portfolio', 'decisions', 'skill', 'certs', 'cards', 'starter', 'datasets', 'tools', 'trackdata', 'enterprise', 'external', 'drills', 'personas', 'lifecycle', 'decision']
    .forEach(x => dynamic.add(x));
  a.stages.forEach(s => dynamic.add('stage-' + s.id));
  const dynamicPrefixes = ['card=', 'deck=', 'mock', 'cat=', 'q=', 'scenario=', 'tab=', 'ev-', 'cr-', 'tpl-'];

  const files = walk(root, p => /\.(html|js|json|md)$/.test(p) && !/[\\/](node_modules|\.git|starter|tests|docs)[\\/]/.test(p) && !/[\\/]content[\\/]schema[\\/]/.test(p));
  const idCache = {};
  const idsOf = f => idCache[f] || (idCache[f] = new Set([...fs.readFileSync(f, 'utf8').matchAll(/\bid="([^"]+)"/g)].map(m => m[1])));
  let checked = 0;
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    const isHtml = f.endsWith('.html');
    const base = path.dirname(f);
    /* comments are prose, not links */
    const src = isHtml ? raw : raw.replace(/\/\*[\s\S]*?\*\//g, '');
    /* links that open a new tab must not hand the new page a reference back to this one */
    for (const m of src.matchAll(/<a[^>]*target=\?["']_blank[^>]*>/g)) t.ok(/rel=\?["'][^"']*noopener/.test(m[0]), `${rel(f)}: new-tab link without rel="noopener": ${m[0].slice(0, 120)}`);
    const refs = new Set();
    for (const m of src.matchAll(/\b(?:href|src)=\\?["']([^"'<>{}$\\]+)\\?["']/g)) refs.add(m[1]);
    if (!isHtml) for (const m of src.matchAll(/["'`(]((?:\.\.\/)*[a-z0-9-]+(?:\/[a-z0-9-]+)*\.html(?:#[^"'`)\s]*)?)["'`)]/g)) refs.add(m[1]);
    for (const r of refs) {
      if (/^(https?:|mailto:|data:|javascript:|#$|\/\/)/.test(r) || r.includes('${') || /#[a-z]*-?$/.test(r) && !/#[a-z]{3,}$/.test(r)) continue;
      if (r.startsWith('/') && f.endsWith('404.html')) continue; /* 404.html rewrites these for the project base path */
      const [p, hash] = r.split('#');
      /* paths in generated scripts are relative to the page that runs them; resolve against the site root */
      /* content and scripts write paths from the site root; repository docs (README, CONTRIBUTING…) from the repo root */
      const repoDoc = f.endsWith('.md') && !/^(content|site)\//.test(rel(f));
      const target = !p ? f : isHtml ? path.resolve(base, p) : repoDoc && fs.existsSync(path.resolve(root, p)) ? path.resolve(root, p) : path.resolve(site, p);
      checked++;
      if (!t.ok(fs.existsSync(target), `${rel(f)}: link to missing file "${r}"`)) continue;
      if (!hash || !target.endsWith('.html')) continue;
      const h = decodeURIComponent(hash);
      const ok = idsOf(target).has(h) || dynamic.has(h) || dynamicPrefixes.some(x => h.startsWith(x)) || /^[a-z]+-[a-z0-9-]+:(asg|int|ass)/.test(h) && dynamic.has(h.split(':')[0]);
      t.ok(ok, `${rel(f)}: "${r}" points at #${h}, which ${rel(target)} does not contain`);
    }
  }
  t.ok(checked > 50, `only ${checked} links found; the link scanner is probably broken`);
};
