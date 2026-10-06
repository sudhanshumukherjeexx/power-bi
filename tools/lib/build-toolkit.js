/* BI Developer Toolkit outputs:
     toolkit.html              the hub: seven doors (Library links to resources.html), "what are you trying to do?" search and filters
     toolkit/<door>.html       one page per door, listing its guides
     toolkit/<guide>.html      one page per guide, rendered from content/toolkit/guides/<guide>.md at build time
     toolkit/<guide>.md        the guide as a download, for guides marked "download": true
     toolkit/files/<name>      extra downloads a guide lists in "files"
     assets/js/toolkit.js      TOOLKIT: the index the hub searches (guides, their sections, lessons, scenarios,
                               templates and the external references the guides cite) */
'use strict';
const fs = require('fs'), path = require('path');
const P = require('./partials');
const ICON = require('./icons');
const { render, esc, slug } = require('./md');
const { check } = require('./toolkit');

const ROLE = { tree: 'start', errors: 'start', runbook: 'start', tool: 'tool', checklist: 'checklist', reference: 'reference', library: 'reference', radar: 'reference', career: 'career' };
const ROLES = [['start', 'Start here'], ['playbook', 'Playbook'], ['learn', 'Learn'], ['tool', 'Tool'], ['practise', 'Practise'], ['checklist', 'Checklist & template'], ['reference', 'Reference'], ['career', 'Career']];
const KIND_LABEL = { guide: 'Guide', tree: 'Troubleshooting', reference: 'Reference', tool: 'Tools', pattern: 'Patterns', decision: 'Decisions', checklist: 'Checklists', runbook: 'Runbook', errors: 'Error decoder', library: 'Library', career: 'Career', radar: 'Change radar' };
const TIER_LABEL = { official: 'Official', specialist: 'Specialist', community: 'Community', 'third-party': 'Third party', book: 'Book' };
const plain = s => String(s).replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*#>|]/g, ' ').replace(/\s+/g, ' ').trim();
const cut = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
const dateTxt = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

module.exports = (all, { BANNER, J }) => {
  const tk = all.toolkit;
  if (!tk) return {};
  const errs = check(tk, all);
  if (errs.length) throw new Error('toolkit content:\n  ' + errs.join('\n  '));
  const out = {};
  const r = '../';
  const doorOf = id => tk.doors.find(d => d.id === id);
  const topics = Object.fromEntries(all.modules.flatMap(m => m.topicsData.map(t => [t.id, Object.assign({ module: m.id, moduleName: m.name }, t)])));
  const scen = Object.fromEntries((all.scenarios || []).map(s => [s.id, s]));
  const tpl = Object.fromEntries((all.templates || []).map(t => [t.id, t]));
  const stageName = id => (all.stages.find(s => s.id === id) || {}).name || id;
  const toolName = id => (tk.tools.find(t => t.id === id) || {}).name || id;
  const certsOfTopic = id => all.certs.filter(c => c.versions.some(v => v.areas.some(a => (a.topics || []).includes(id)))).map(c => c.id);

  /* ---------- build-time macros the guides can use ---------- */
  const macros = {
    datasets(meta) {
      const info = meta.datasetInfo || {};
      return `<div class="dscards">${all.datasets.map(d => {
        const m = info[d.key] || {};
        return `<div class="dscard"><h4 id="lab-${esc(d.key)}">${esc(d.name)}</h4><dl>
          <dt>Type</dt><dd>${esc(m.type || '')}</dd><dt>Grain</dt><dd>${esc(m.grain || '')}</dd>
          <dt>Scale</dt><dd>${d.rows.length} rows · ${d.cols.length} columns</dd><dt>Used for</dt><dd>${esc(m.use || '')}</dd>
          <dt>Planted problems</dt><dd>${esc(m.defects || 'None: a clean table')}</dd></dl>
          <p class="small"><a href="${r}resources.html#ds-${esc(d.key)}">Preview and download</a></p></div>`;
      }).join('')}</div>`;
    },
    'track-files'() {
      return `<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">File</th><th scope="col">Rows</th><th scope="col">What it is</th></tr></thead><tbody>${(all.trackDatasets || []).map(d => `<tr><td><a href="${r}${esc(d.file)}" download>${esc(d.name)}</a></td><td>${d.rows || (d.profile && d.profile.rows) || ''}</td><td>${esc(d.desc || '')}</td></tr>`).join('')}</tbody></table></div>`;
    },
    templates() {
      return `<div class="cards">${(all.templates || []).map(t => `<div class="mcard"><h4 id="tpl-${esc(t.id)}">${esc(t.title)}</h4><p class="small muted">${esc(t.summary)}</p><p class="small">${(t.used || []).length ? 'Used in ' + t.used.map(id => scen[id] ? `<a href="${r}experience/${scen[id].slug}.html">${esc(scen[id].ticket.id)}</a>` : '').join(', ') + ' · ' : ''}<a href="${r}templates.html#tpl-${esc(t.id)}">Read</a> · <a href="${r}templates/${esc(t.id)}.md" download>Download .md</a></p></div>`).join('')}</div>`;
    },
    'cert-chain'(meta, arg) {
      const c = all.certs.find(x => x.id === arg);
      if (!c) throw new Error(`cert-chain: unknown certification "${arg}"`);
      const today = new Date().toISOString().slice(0, 10);
      const v = c.versions.find(x => x.effective > today) || c.versions.filter(x => x.effective <= today).pop() || c.versions[c.versions.length - 1];
      const scenFor = ids => {
        const skills = new Set(ids.flatMap(id => (topics[id] && topics[id].skills) || []));
        return (all.scenarios || []).filter(s => s.type !== 'drill' && (s.skills || []).some(k => skills.has(k))).slice(0, 3);
      };
      return `<p class="small muted">Outline: ${esc(v.label)}. Check the <a href="${esc(c.url)}" rel="noopener" target="_blank" class="ext">official study guide</a> before you book.</p>` +
        v.areas.map(a => `<h4>${esc(a.n)} <span class="small muted">(${esc(a.w)})</span></h4><div class="tblscroll"><table class="tbl chain"><thead><tr><th scope="col">Microsoft objective</th><th scope="col">Learn it</th><th scope="col">Drill it</th><th scope="col">Use it at work</th></tr></thead><tbody>${(a.skills || [{ n: a.n, topics: a.topics }]).map(sk => {
          const ts = (sk.topics || []).filter(id => topics[id]);
          const asg = ts.reduce((n, id) => n + topics[id].asg.length, 0);
          const cards = ts.reduce((n, id) => n + topics[id].int.length, 0);
          return `<tr><td>${esc(sk.n)}</td><td>${ts.map(id => `<a href="${r}${topics[id].module}.html#${id}">${esc(topics[id].name.split(':')[0])}</a>`).join('<br>')}</td><td>${asg} assignments<br>${cards} interview questions${(a.cards || []).length ? `<br><a href="${r}flashcards.html#deck=concepts&amp;cat=${encodeURIComponent(a.cards[0])}">${esc(a.cards[0])} cards</a>` : ''}</td><td>${scenFor(ts).map(s => `<a href="${r}experience/${s.slug}.html">${esc(s.ticket.id)}</a>`).join(', ')}</td></tr>`;
        }).join('')}</tbody></table></div>`).join('') +
        `<p class="small">Your confidence per area is on the <a href="${r}learn.html#certs">certification map</a>, measured from your assignments, quiz answers and flashcards.</p>`;
    },
    scenarios() {
      return `<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Ticket</th><th scope="col">Scenario</th><th scope="col">Stage</th><th scope="col">Skills</th></tr></thead><tbody>${(all.scenarios || []).map(s => `<tr><td>${esc(s.ticket.id)}</td><td><a href="${r}experience/${s.slug}.html">${esc(s.title)}</a></td><td>${esc(stageName(s.stage))}</td><td>${esc((s.skills || []).join(', '))}</td></tr>`).join('')}</tbody></table></div>`;
    }
  };

  /* ---------- guide pages ---------- */
  const rendered = {};
  for (const g of tk.guides) {
    const res = render(g._body, { root: r, id: g.id, diagramLabel: g.title + ' diagram', macro: (name, arg) => { if (!macros[name]) throw new Error(`${g._file}: unknown macro "${name}"`); return macros[name](g, arg); } });
    rendered[g.id] = res;
    const door = doorOf(g.door);
    const h2 = res.headings.filter(h => h.level === 2);
    const rel = [];
    if ((g.lessons || []).length) rel.push(`<div><h3>Learn it</h3><ul>${g.lessons.map(id => `<li><a href="${r}${topics[id].module}.html#${id}">${esc(topics[id].name.split(':')[0])}</a> <span class="small muted">${esc(topics[id].moduleName)}</span></li>`).join('')}</ul></div>`);
    if ((g.scenarios || []).length) rel.push(`<div><h3>Practise it</h3><ul>${g.scenarios.map(id => `<li><a href="${r}experience/${scen[id].slug}.html">${esc(scen[id].ticket.id)}: ${esc(scen[id].title)}</a></li>`).join('')}</ul></div>`);
    if ((g.templates || []).length) rel.push(`<div><h3>Templates</h3><ul>${g.templates.map(id => `<li><a href="${r}templates.html#tpl-${id}">${esc(tpl[id].title)}</a></li>`).join('')}</ul></div>`);
    if ((g.files || []).length) rel.push(`<div><h3>Downloads</h3><ul>${g.files.map(f => `<li><a href="${r}toolkit/files/${esc(f.name)}" download>${esc(f.title || f.name)}</a> <span class="small muted">${esc(f.name)}</span></li>`).join('')}</ul></div>`);
    if ((g.refs || []).length) rel.push(`<div class="wide"><h3>Further reading</h3><ul class="refs">${g.refs.map(x => `<li><a href="${esc(x.u)}" rel="noopener" target="_blank" class="ext">${esc(x.t)}</a> <span class="tier ${esc(x.src)}">${TIER_LABEL[x.src]}</span>${x.paid ? ' <span class="tier paid">Paid</span>' : ''}${x.note ? ` <span class="small muted">${esc(x.note)}</span>` : ''}</li>`).join('')}</ul></div>`);
    const chips = (g.stages || []).map(s => `<span class="chip">${esc(stageName(s))}</span>`).join('') + (g.tools || []).slice(0, 4).map(t => `<span class="chip tool">${esc(toolName(t))}</span>`).join('');
    const title = `${g.title} · BI Developer Toolkit · The Power BI Fellowship`;
    const gl = [P.crumbsLd([['Toolkit', 'toolkit.html'], [door.name, door.href || `toolkit/${door.id}.html`], [g.title, `toolkit/${g.id}.html`]]),
      { '@type': 'TechArticle', headline: g.title, description: g.summary, url: P.site.url + `toolkit/${g.id}.html`, inLanguage: 'en', isAccessibleForFree: true, ...(g.verified && g.verified.date ? { dateModified: g.verified.date } : {}), about: (g.tools || []).slice(0, 6).map(t => toolName(t)), isPartOf: { '@type': 'WebSite', name: P.site.name, url: P.site.url } }];
    out[`toolkit/${g.id}.html`] = `${P.head({ title, description: g.summary, path: `toolkit/${g.id}.html`, r, type: 'article', jsonld: gl })}
<body data-root="${r}" data-guide="${g.id}">
<a class="skip" href="#app">Skip to content</a>
<!--nav:toolkit-->
${P.nav('toolkit', r)}
<!--/nav-->
<main class="wrap tk" id="app" tabindex="-1">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${r}toolkit.html">Toolkit</a><span aria-hidden="true">/</span><a href="${r}toolkit/${door.id}.html">${esc(door.name)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(g.title)}</span></nav>
<header class="intro tkhead">
<div class="kicker">${ICON.use(door.icon, r)} ${esc(door.name)} · ${esc(KIND_LABEL[g.kind])}</div>
<h1>${esc(g.title)}</h1>
<p class="lead">${esc(g.summary)}</p>
<div class="tkmeta">${chips}<span class="verified" title="Checked against the sources on this date">Checked ${dateTxt(g.verified.date)}</span>${g.download ? `<a class="btn sm" href="${r}toolkit/${g.id}.md" download>Download .md</a>` : ''}<button class="btn sm" type="button" data-print>Print</button></div>
</header>
${h2.length > 2 ? `<details class="tktoc" open><summary class="ctl-lbl">On this page <span>(${h2.length})</span></summary><nav class="jump wrapjump" aria-label="On this page">${h2.map(h => `<a href="#${h.id}">${esc(h.text)}</a>`).join('')}</nav></details>` : ''}
<article class="tkbody">
${res.html}
</article>
${rel.length ? `<aside class="tkrel" aria-label="Related">${rel.join('')}</aside>` : ''}
<p class="small muted tkfoot">Something missing or out of date? <a href="${esc(all.site.repo || 'https://github.com/sudhanshumukherjeexx/power-bi')}/issues/new?title=${encodeURIComponent('Toolkit: ' + g.title)}">Open an issue</a> or edit <code>${esc(g._file)}</code>.</p>
</main>
${P.footer(r)}
<script src="${r}assets/js/glossary.js"></script>
<script src="${r}assets/js/store.js"></script>
<script src="${r}assets/js/site.js"></script>
<script src="${r}assets/js/tkguide.js"></script>
</body>
</html>
`;
    if (g.download) out[`toolkit/${g.id}.md`] = `# ${g.title}\n\n${g.summary}\n\nFrom the BI Developer Toolkit: ${all.site.url || ''}toolkit/${g.id}.html\n\n` + g._body.replace(/^:::.*$/gm, '').replace(/\]\((?!https?:|#)([^)]+)\)/g, `](${all.site.url || ''}$1)`);
    for (const f of g.files || []) out[`toolkit/files/${f.name}`] = fs.readFileSync(path.join(all.root, 'content', 'toolkit', 'files', f.src || f.name), 'utf8').replace(/\r\n/g, '\n');
  }

  /* ---------- door pages ---------- */
  for (const d of tk.doors.filter(x => !x.href)) {
    const gs = tk.guides.filter(g => g.door === d.id);
    const groups = [...new Set(gs.map(g => g.group || ''))];
    out[`toolkit/${d.id}.html`] = `${P.head({ title: `${d.name} · BI Developer Toolkit · The Power BI Fellowship`, description: `${d.q} ${d.desc}`, path: `toolkit/${d.id}.html`, r, jsonld: [P.crumbsLd([['Toolkit', 'toolkit.html'], [d.name, `toolkit/${d.id}.html`]])] })}
<body data-root="${r}" data-door="${d.id}">
<a class="skip" href="#app">Skip to content</a>
<!--nav:toolkit-->
${P.nav('toolkit', r)}
<!--/nav-->
<main class="wrap tk" id="app" tabindex="-1">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${r}toolkit.html">Toolkit</a><span aria-hidden="true">/</span><span aria-current="page">${esc(d.name)}</span></nav>
<header class="intro tkhead"><div class="kicker">${ICON.use(d.icon, r)} BI Developer Toolkit</div><h1>${esc(d.name)}</h1><p class="lead">“${esc(d.q)}” ${esc(d.desc)}</p></header>
${groups.map(gr => `${gr ? `<h2 class="tkgroup">${esc(gr)}</h2>` : ''}<div class="cards">${gs.filter(g => (g.group || '') === gr).map(g => `<a class="mcard tkcard" href="${r}toolkit/${g.id}.html"><span class="tkk">${esc(KIND_LABEL[g.kind])}</span><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><span class="small muted">${(g.stages || []).map(stageName).join(' · ')}</span></a>`).join('')}</div>`).join('')}
${(d.also || []).length ? `<h2 class="tkgroup">Elsewhere on the site</h2><p>${d.also.map(([h, t]) => `<a class="btn sm" href="${r}${h}">${esc(t)}</a>`).join(' ')}</p>` : ''}
<p><a href="${r}toolkit.html">← All of the Toolkit</a></p>
</main>
${P.footer(r)}
<script src="${r}assets/js/store.js"></script>
<script src="${r}assets/js/site.js"></script>
<script src="${r}assets/js/tkguide.js"></script>
</body>
</html>
`;
  }

  /* ---------- hub ---------- */
  const facetOpts = (list, label) => `<label><span>${label}</span><select data-f="${label.toLowerCase()}"><option value="">Any</option>${list.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('')}</select></label>`;
  out['toolkit.html'] = `${P.head({ title: 'BI Developer Toolkit: references, tools, playbooks and templates · The Power BI Fellowship', description: tk.tagline + ' DAX and Power Query field guides, troubleshooting trees, a performance clinic, production runbook, checklists, templates and career guides.', path: 'toolkit.html' })}
<body data-page="toolkit">
<a class="skip" href="#app">Skip to content</a>
<!--nav:toolkit-->
${P.nav('toolkit', '', 'toolkit.html')}
<!--/nav-->
<main class="wrap tk" id="app" tabindex="-1">
<header class="intro tkhead"><h1>${esc(tk.title)}</h1><p class="lead">${esc(tk.tagline)} ${esc(tk.intro.split('. ').slice(1).join('. '))}</p>
<form class="tksearch" role="search" id="tkform"><label for="tkq">What are you trying to do?</label><div class="tkq"><input type="search" id="tkq" placeholder="Search DAX, RLS, gateway, deployment, Direct Lake, performance…" autocomplete="off" spellcheck="false" enterkeyhint="search"><button class="btn primary" type="submit">Search</button></div>
<details class="tkfilters"><summary>Filter by Skill · Stage · Tool · Problem · Certification</summary><div class="tkf">
${facetOpts(all.skills.map(s => [s.id, s.name || s.id]), 'Skill')}
${facetOpts(all.stages.map(s => [s.id, s.name]), 'Stage')}
${facetOpts(tk.tools.map(t => [t.id, t.name]), 'Tool')}
${facetOpts(tk.problems.map(p => [p.id, p.name]), 'Problem')}
${facetOpts(all.certs.map(c => [c.id, c.code]), 'Certification')}
<button class="btn sm" type="button" id="tkclear">Clear</button></div></details></form>
<div class="tkbroken"><span class="small muted">Something broken?</span>${tk.broken.map(([t, h]) => `<a class="chip" href="${h}">${esc(t)}</a>`).join('')}<a class="chip" href="toolkit/whats-broken.html">More…</a></div>
</header>
<section id="tkresults" class="tkresults" aria-live="polite" hidden></section>
<section id="tkdoors" aria-label="Sections"><div class="doors tkdoors">${tk.doors.map(d => { const gs = tk.guides.filter(g => g.door === d.id); return `<a class="door" href="${d.href || `toolkit/${d.id}.html`}"><span class="dic">${ICON.use(d.icon)}</span><h2>${esc(d.name)}</h2><p class="q">“${esc(d.q)}”</p><p>${esc(d.desc)}</p><span class="more">${d.href ? esc(d.links || 'Open') : `${gs.length} guide${gs.length > 1 ? 's' : ''}`} →</span></a>`; }).join('')}</div></section>
<p class="small muted tkfoot">Every page here is checked against its sources and carries the date it was last checked. Official Microsoft documentation is linked wherever it is the authority; specialist and community sources are labelled as such.</p>
</main>
${P.footer()}
<script src="assets/js/toolkit.js"></script>
<script src="assets/js/store.js"></script>
<script src="assets/js/site.js"></script>
<script src="assets/js/tkhub.js"></script>
</body>
</html>
`;

  /* ---------- search index for the hub ---------- */
  const items = [];
  const tag = o => [...(o.stages || []).map(x => 's:' + x), ...(o.skills || []).map(x => 'k:' + x), ...(o.tools || []).map(x => 't:' + x), ...(o.problems || []).map(x => 'p:' + x), ...(o.certs || []).map(x => 'c:' + x)].join(' ');
  const add = (role, t, s, x, h, tags, kw) => items.push([role, t, s, cut(plain(x || ''), 400), h, tags || '', kw || '']);
  const refSeen = new Map();
  for (const g of tk.guides) {
    const role = ROLE[g.kind] || 'playbook';
    const tags = tag(g);
    const kw = [(g.keywords || []).join(' '), (g.problems || []).map(p => (tk.problems.find(x => x.id === p) || {}).name).join(' '), (g.tools || []).map(toolName).join(' ')].join(' ');
    add(role, g.title, doorOf(g.door).name, g.summary, `toolkit/${g.id}.html`, tags, kw.toLowerCase());
    /* each section: its heading and the text under it */
    const lines = g._body.split('\n');
    const secs = [];
    let cur = null;
    for (const l of lines) { const m = l.match(/^(#{2,3})\s+(.*)/); if (m) { cur = { text: m[2], body: [] }; secs.push(cur); } else if (cur) cur.body.push(l); }
    const hs = rendered[g.id].headings.filter(h => h.level === 2 || h.level === 3);
    secs.forEach((s, i) => { if (hs[i]) add(role, hs[i].text, g.title, s.body.join(' '), `toolkit/${g.id}.html#${hs[i].id}`, tags); });
    for (const x of g.refs || []) {
      const e = refSeen.get(x.u);
      if (e) { e[5] = [...new Set((e[5] + ' ' + tags).split(' ').filter(Boolean))].join(' '); continue; }
      add('reference', x.t, TIER_LABEL[x.src] + (x.paid ? ' · Paid' : ' · Free') + ' · cited in ' + g.title, (x.note || '') + ' ' + g.summary, x.u, tags);
      refSeen.set(x.u, items[items.length - 1]);
    }
  }
  for (const x of (all.external && all.external.items) || []) {
    if (refSeen.has(x.u)) continue;
    const cat = (all.external.categories.find(c => c.id === x.c) || {}).name || '';
    add('reference', x.t, `${TIER_LABEL[x.src]} · ${x.cost === 'paid' ? 'Paid' : 'Free'} · ${cat}`, x.d, x.u, tag({ stages: [x.stage], skills: [] }), cat.toLowerCase());
    refSeen.set(x.u, items[items.length - 1]);
  }
  for (const T of Object.values(topics)) add('learn', T.name.split(':')[0], T.moduleName, (T.why ? T.why.matters : '') + ' ' + (T.skills || []).join(' '), `${T.module}.html#${T.id}`, tag({ stages: [T.stage].filter(Boolean), skills: T.skills, certs: certsOfTopic(T.id) }));
  for (const s of all.scenarios || []) add('practise', s.title, `${s.ticket.id} · ${stageName(s.stage)}`, s.summary + ' ' + (s.seo || '') + ' ' + (s.skills || []).join(' '), `experience/${s.slug}.html`, tag({ stages: [s.stage], skills: s.skills }));
  for (const t of all.templates || []) add('checklist', t.title, 'Template', t.summary, `templates.html#tpl-${t.id}`, '');
  /* the rest of the site's study tools */
  [['career', 'Interview flashcards', 'Interview practice', 'Spaced-repetition interview questions and answers for every level and track.', 'flashcards.html', 'p:interview'],
   ['career', 'Mock interview', 'Interview practice', 'Timed interview questions answered out loud.', 'flashcards.html#mock', 'p:interview'],
   ['career', 'Career paths', 'Learn', 'Data analyst, BI developer, analytics engineer and lead: the topics each role needs.', 'learn.html#paths', 'p:career'],
   ['career', 'Certification map', 'Learn', 'PL-300 and DP-600 outlines with your readiness per area.', 'learn.html#certs', 'p:certification c:pl300 c:dp600'],
   ['career', 'Find your starting point', 'Diagnostic', 'Sixteen questions that recommend where to start.', 'diagnostic.html', 'p:career'],
   ['reference', 'Glossary', 'Reference', `${all.glossary.length} Power BI and data terms explained in plain English.`, 'glossary.html', ''],
   ['reference', 'Cheat sheets', 'Reference', 'Printable one-page summaries per level: DAX, Power Query, modeling and Service.', 'cheatsheet.html', ''],
   ['practise', 'Practice datasets', 'Library', 'The 14 Northwind datasets to preview, copy or download.', 'resources.html#datasets', 'p:model-design'],
   ['practise', 'Starter Power BI project', 'Library', 'A PBIP star schema with every clean table loaded and related.', 'resources.html#starter', 'p:model-design']
  ].forEach(x => add(...x));
  out['assets/js/toolkit.js'] = BANNER('content/toolkit') +
    `/* The Toolkit hub's search index. Item: [role, title, sub, text, href, tags, keywords]; tags are s:stage k:skill t:tool p:problem c:cert. */\n` +
    `const TOOLKIT={roles:${J(ROLES)},items:[\n${items.map(J).join(',\n')}\n]};\n`;

  all.toolkitRendered = rendered;
  return out;
};
