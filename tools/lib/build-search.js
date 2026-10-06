/* assets/js/search-index.js: one flat index of everything, loaded by the search dialog on first use.
   Entry: [type, title, sub, text, href, facet]. facet lists the level/track id and stage id it belongs to. */
'use strict';
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cut = (s, n = 320) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };

const PAGES = [
  ['Home', 'Start, continue, and choose a goal', 'index.html'],
  ['Learn: Skill Mode', 'Levels, tracks, career paths and certification maps', 'learn.html'],
  ['Experience Mode: real BI work', 'Tickets, incidents, change requests and decisions at Northwind Outdoors', 'experience.html'],
  ['Your progress', 'Competency review: evidence, stages, portfolio evidence, decision log, certification preparation', 'progress.html'],
  ['Find my starting point', 'Diagnostic: sixteen questions, a recommended start', 'diagnostic.html'],
  ['Professional templates', 'Requirements, ADR, incident report, postmortem, PR, runbook and more', 'templates.html'],
  ['Library (BI Developer Toolkit)', 'Glossary, cheat sheets, external resources, datasets, starter project, study tools', 'resources.html'],
  ['BI Developer Toolkit', 'References, tools, troubleshooting, playbooks, checklists, templates and career guides', 'toolkit.html'],
  ['Interview flashcards', 'Spaced repetition, all decks', 'flashcards.html'],
  ['Mock interview', 'Timed questions, out loud', 'flashcards.html#mock'],
  ['Glossary', 'Plain-English definitions', 'glossary.html'],
  ['Cheat sheets', 'Printable, one per level', 'cheatsheet.html'],
  ['Career paths', 'Analyst, Developer, Analytics Engineer, Lead', 'learn.html#paths'],
  ['Certification map', 'PL-300 and DP-600, versioned', 'learn.html#certs'],
  ['Starter Power BI project', 'Model with every CSV loaded and related', 'resources.html#starter']
];

module.exports = (all, { BANNER, J }) => {
  const idx = [];
  const add = (type, title, sub, text, href, facet) => idx.push([type, title, sub, cut(text), href, facet || '']);
  PAGES.forEach(([t, s, h]) => add('Page', t, s, s, h));
  for (const m of all.modules) {
    add(m.kind === 'level' ? 'Level' : 'Track', m.name, m.kind === 'level' ? 'Skill Mode level' : 'Skill Mode track', (m.tagline || '') + ' ' + m.intro, m.id + '.html', m.id);
    for (const T of m.topicsData) {
      const facet = [m.id, T.stage].filter(Boolean).join(' ');
      const page = m.id + '.html';
      add('Topic', T.name, m.name, T.ds.join(' ') + ' ' + (T.why ? T.why.matters : ''), page + '#' + T.id, facet);
      T.asg.forEach((a, i) => add('Assignment', a.t, `${m.name} · ${T.name}`, [a.brief, (a.req || []).join(' '), (a.steps || []).join(' '), a.exp].filter(Boolean).join(' '), `${page}#${T.id}:asg:${i}`, facet));
      T.int.forEach((q, i) => add('Interview', q.q, `${m.name} · ${T.name}`, q.a, `${page}#${T.id}:int:${i}`, facet));
      T.ass.forEach((q, i) => add('Assessment', q.q, `${m.name} · ${T.name}`, (q.o || []).join(' ') + ' ' + (q.why || q.hint || ''), `${page}#${T.id}:ass:${i}`, facet));
    }
  }
  for (const s of all.scenarios || []) {
    add(s.type === 'drill' ? 'Drill' : 'Scenario', s.title, `${s.ticket ? s.ticket.id + ' · ' : ''}${(all.stages.find(x => x.id === s.stage) || {}).name || ''}`, /* no skills: a scenario must not announce what kind of problem it is (shown after completion instead) */ s.summary + ' ' + (s.deliverables || []).map(d => d.t).join(' '), `experience/${s.slug}.html`, s.stage);
  }
  for (const t of all.templates || []) add('Template', t.title, 'Professional template', t.summary + ' ' + (t.used || []).join(' '), `templates.html#tpl-${t.id}`);
  if (all.toolkit) for (const g of all.toolkit.guides) {
    add('Toolkit', g.title, 'BI Developer Toolkit', g.summary + ' ' + (g.keywords || []).join(' '), `toolkit/${g.id}.html`, (g.stages || []).join(' '));
    for (const m of g._body.matchAll(/^## (.+)$/gm)) add('Toolkit', m[1].replace(/[*`]/g, ''), g.title, g.summary, `toolkit/${g.id}.html#${slug(m[1].replace(/[*`]/g, ''))}`, (g.stages || []).join(' '));
  }
  all.datasets.forEach(d => add('Dataset', d.name, `${d.rows.length} rows · ${d.cols.length} cols`, d.desc + ' ' + d.cols.join(' '), 'resources.html#ds-' + d.key));
  all.concepts.forEach(c => add('Flashcard', c.q, c.c, c.a + ' ' + (c.x || ''), 'flashcards.html#card=c' + hash(c.q)));
  all.glossary.forEach(g => add('Glossary', g.t, g.c, (g.k || []).join(' ') + ' ' + g.d, 'glossary.html#' + slug(g.t)));
  for (const c of all.certs) {
    const v = c.versions[c.versions.length - 1];
    for (const a of v.areas) for (const sk of a.skills || []) add('Certification', `${c.code}: ${sk.n}`, `${a.n} (${a.w}) · ${v.label}`, sk.items.join(' · '), 'learn.html#certs', c.id);
  }
  const facets = [
    { g: 'Levels', items: all.modules.filter(m => m.kind === 'level').map(m => [m.id, m.name]) },
    { g: 'Tracks', items: all.modules.filter(m => m.kind === 'track').map(m => [m.id, m.name]) },
    { g: 'Professional stages', items: all.stages.map(s => [s.id, `${s.n}. ${s.name}`]) },
    { g: 'Certifications', items: all.certs.map(c => [c.id, c.code]) }
  ].filter(g => g.items.length);
  return {
    'assets/js/search-index.js': BANNER('everything under content/') + `const SEARCH_FACETS=${J(facets)};\nconst SEARCH_INDEX=[\n${idx.map(J).join(',\n')}\n];\n`
  };
};
