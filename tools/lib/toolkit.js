/* BI Developer Toolkit content: content/toolkit/index.json (doors and tag vocabularies) and one Markdown guide per
   file, content/toolkit/guides/<id>.md, with JSON front matter. load() parses them; check() lists every problem
   with the metadata, so the build fails and the tests say exactly what is wrong. */
'use strict';
const fs = require('fs'), path = require('path');
const { parse } = require('./md');

function load(root) {
  const dir = path.join(root, 'content', 'toolkit');
  if (!fs.existsSync(dir)) return null;
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  const gdir = path.join(dir, 'guides');
  const guides = fs.readdirSync(gdir).filter(f => f.endsWith('.md')).map(f => {
    const file = `content/toolkit/guides/${f}`;
    const { meta, body } = parse(fs.readFileSync(path.join(gdir, f), 'utf8'), file);
    return Object.assign({ _file: file, _name: f.replace(/\.md$/, ''), _body: body }, meta);
  });
  const doorOrder = index.doors.map(d => d.id);
  guides.sort((a, b) => doorOrder.indexOf(a.door) - doorOrder.indexOf(b.door) || (a.order || 99) - (b.order || 99) || a.title.localeCompare(b.title));
  return Object.assign({}, index, { guides });
}

const TIERS = ['official', 'specialist', 'community', 'third-party', 'book'];
const KINDS = ['guide', 'tree', 'reference', 'tool', 'pattern', 'decision', 'checklist', 'runbook', 'errors', 'library', 'career', 'radar'];

/* every problem with the toolkit metadata, as readable messages */
function check(tk, all) {
  const errs = [];
  if (!tk) return ['content/toolkit is missing'];
  const ids = new Set();
  const doors = new Set(tk.doors.map(d => d.id));
  const vocab = {
    stages: new Set(all.stages.map(s => s.id)),
    skills: new Set(all.skills.map(s => s.id)),
    tools: new Set(tk.tools.map(t => t.id)),
    problems: new Set(tk.problems.map(p => p.id)),
    certs: new Set(all.certs.map(c => c.id)),
    lessons: new Set(all.modules.flatMap(m => m.topicsData.map(t => t.id))),
    scenarios: new Set((all.scenarios || []).map(s => s.id)),
    templates: new Set((all.templates || []).map(t => t.id))
  };
  for (const g of tk.guides) {
    const at = g._file;
    if (g.id !== g._name) errs.push(`${at}: id "${g.id}" must match the file name`);
    if (ids.has(g.id)) errs.push(`${at}: duplicate id "${g.id}"`);
    if (doors.has(g.id)) errs.push(`${at}: id "${g.id}" collides with a door page`);
    ids.add(g.id);
    for (const k of ['title', 'summary', 'door', 'kind']) if (!g[k]) errs.push(`${at}: "${k}" is required`);
    if (g.door && !doors.has(g.door)) errs.push(`${at}: unknown door "${g.door}"`);
    if (g.kind && !KINDS.includes(g.kind)) errs.push(`${at}: unknown kind "${g.kind}" (use ${KINDS.join(', ')})`);
    for (const [k, set] of Object.entries(vocab)) for (const v of g[k] || []) if (!set.has(v)) errs.push(`${at}: ${k} lists unknown id "${v}"`);
    if (!g.verified || !/^\d{4}-\d{2}-\d{2}$/.test(g.verified.date || '')) errs.push(`${at}: verified.date (YYYY-MM-DD) is required`);
    for (const r of g.refs || []) {
      if (!r.t || !/^https:\/\//.test(r.u || '')) errs.push(`${at}: every ref needs a title "t" and an https url "u"`);
      if (!TIERS.includes(r.src)) errs.push(`${at}: ref "${r.t}" has src "${r.src}"; use ${TIERS.join(', ')}`);
    }
    if (/utm_[a-z]+=/.test(g._body + JSON.stringify(g.refs || []))) errs.push(`${at}: remove tracking parameters (utm_…) from links`);
    if (!/^## /m.test(g._body)) errs.push(`${at}: needs at least one "## " section`);
  }
  for (const d of tk.doors) {
    if (d.href) { if (!/^[a-z0-9-]+\.html$/.test(d.href)) errs.push(`content/toolkit/index.json: door "${d.id}" href must be a page of this site`); if (tk.guides.some(g => g.door === d.id)) errs.push(`content/toolkit/index.json: door "${d.id}" links to ${d.href}, so it can't also hold guides`); continue; }
    if (!tk.guides.some(g => g.door === d.id)) errs.push(`content/toolkit/index.json: door "${d.id}" has no guides`);
  }
  return errs;
}

module.exports = { load, check, TIERS, KINDS };
