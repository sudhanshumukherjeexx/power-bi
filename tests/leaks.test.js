/* Static HTML must not reveal answers (docs/seo-audit.md). Pages are rendered for crawlers and readers without
   JavaScript, so everything in them is public before the learner acts. This test reads every generated page as
   text and fails if it contains a scenario hint, rubric criterion, retrospective question or any sentence of a
   model answer, or a Skill Mode interview answer, quiz explanation or worked solution. */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('../tools/lib/load');
const { site, walk, rel } = require('./lib/util');

module.exports = t => {
  const all = load.all();
  const norm = s => String(s).replace(/\*\*|`/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().toLowerCase();
  const text = html => norm(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '));
  /* every string leaf of a value */
  const leaves = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(x => leaves(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach(x => leaves(x, out)); return out; };
  /* a secret is matched on a distinctive stretch: long enough not to collide with ordinary prose */
  const probes = strs => [...new Set(strs.map(norm).filter(s => s.length >= 40).map(s => s.slice(0, 90)))];

  const pages = walk(site, p => p.endsWith('.html')).map(f => ({ f, html: fs.readFileSync(f, 'utf8') }));
  pages.forEach(p => { p.text = text(p.html); });
  const byFile = Object.fromEntries(pages.map(p => [rel(p.f), p]));

  /* ---------- Experience Mode ---------- */
  const scenSecrets = [];
  for (const s of all.scenarios || []) {
    const secret = probes([...(s.hints || []), ...(s.rubric || []).map(r => r.good), ...(s.retro || []), ...leaves(s._solution)]);
    scenSecrets.push(...secret.map(x => [s.id, x]));
    const pg = byFile[`site/experience/${s.slug}.html`];
    if (!t.ok(pg, `experience/${s.slug}.html missing`)) continue;
    t.ok(pg.text.includes(norm(s.title)) && pg.text.includes(norm(s.summary)), `${s.id}: static page shows the title and summary`);
    t.ok(s.messages.every(m => !m.subject || pg.text.includes(norm(m.subject))), `${s.id}: static page shows the stakeholder messages`);
    t.ok(s.deliverables.every(d => pg.text.includes(norm(d.t))), `${s.id}: static page lists the deliverables`);
    for (const x of secret) t.ok(!pg.text.includes(x), `${s.id}: static page leaks hidden content: "${x.slice(0, 70)}…"`);
  }
  /* no scenario secret on any other page either (the Library, guides, search-facing pages) */
  for (const p of pages) for (const [id, x] of scenSecrets) if (!p.f.includes(`${path.sep}experience${path.sep}`)) t.ok(!p.text.includes(x), `${rel(p.f)} contains hidden content of scenario ${id}: "${x.slice(0, 60)}…"`);

  /* ---------- Skill Mode ---------- */
  for (const m of all.modules) {
    const pg = byFile[`site/${m.id}.html`];
    if (!t.ok(pg, `${m.id}.html missing`)) continue;
    const secret = [];
    /* guided assignments spell out some steps the worked solution repeats; those are public by design */
    const visible = norm(m.topicsData.flatMap(T => T.asg.flatMap(a => [a.t, a.brief, ...(a.req || []), ...(a.steps || []), ...(a.deliverables || []), a.exp])).filter(Boolean).join(' \n '));
    for (const T of m.topicsData) {
      t.ok(T.asg.every(a => pg.text.includes(norm(a.t))), `${m.id}: static page shows every assignment of ${T.id}`);
      T.int.forEach(q => secret.push(q.a));
      T.ass.forEach(q => { if (q.why) secret.push(q.why); });
      T.asg.forEach((_, i) => { const sol = all.solutions[`${T.id}-${i}`]; if (sol) secret.push(...leaves(sol)); });
    }
    for (const x of probes(secret)) if (!visible.includes(x)) t.ok(!pg.text.includes(x), `${m.id}.html leaks an answer: "${x.slice(0, 70)}…"`);
    t.ok(!/\sdata-a="/.test(pg.html), `${m.id}.html carries an answer key attribute`);
    t.ok(!/class="[^"]*\b(ok|correct)\b[^"]*"[^>]*>\s*<input/.test(pg.html), `${m.id}.html marks a correct option`);
  }

  /* ---------- discoverability: every page has the shared SEO block, sitemap covers them ---------- */
  const sitemap = fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8');
  for (const p of pages) {
    const r = rel(p.f).replace(/^site\//, '');
    if (r === '404.html') continue;
    t.ok((p.html.match(/<link rel="canonical"/g) || []).length === 1, `${r}: exactly one canonical link`);
    t.ok(/<meta property="og:image" content="https:\/\//.test(p.html), `${r}: has an absolute og:image`);
    t.ok(/<meta name="description" content="[^"]{50,}"/.test(p.html), `${r}: has a meta description of 50+ characters`);
    t.ok(!/needs JavaScript to show the assignments/.test(p.html), `${r}: stale fallback text`);
    t.ok(sitemap.includes(`<loc>${all.root ? '' : ''}`) && sitemap.includes(r === 'index.html' ? '/power-bi/</loc>' : `/${r}</loc>`), `${r}: missing from sitemap.xml`);
    for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let ok = true; try { const j = JSON.parse(m[1]); ok = j['@context'] === 'https://schema.org' && ['Course', 'LearningResource', 'TechArticle', 'BreadcrumbList'].includes(j['@type']); } catch (e) { ok = false; }
      t.ok(ok, `${r}: structured data must be valid JSON-LD of an accurate type`);
    }
  }
  const titles = {}; for (const p of pages) { const ti = (p.html.match(/<title>([^<]*)<\/title>/) || [])[1]; if (ti) (titles[ti] = titles[ti] || []).push(rel(p.f)); }
  for (const [ti, fs2] of Object.entries(titles)) t.ok(fs2.length === 1, `duplicate <title> "${ti}" on ${fs2.join(', ')}`);
};
