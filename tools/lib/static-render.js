/* Static HTML for pages whose interactive version is rendered by a script: Skill Mode levels and tracks, Experience
   Mode scenarios and the Toolkit Library. Crawlers, previews and people without JavaScript get the real content;
   the page script then replaces <main> with the interactive version (progress, quizzes, reveals, notes).

   Only what a learner sees BEFORE acting is rendered here (docs/seo-audit.md). Never: worked solutions, interview
   answers, the correct option or its explanation, scenario hints, rubric criteria, retrospective questions, the
   model answer, or evidence bodies. tests/leaks.test.js fails the build if any of them appear in a page. */
'use strict';
const { esc } = require('./partials');

const GUIDE = { A: 'Guided', B: 'Objective', C: 'Problem', D: 'Ambiguous' };
const KIND = { ticket: 'Ticket', incident: 'Incident', change: 'Change request', review: 'Review', decision: 'Decision', uat: 'UAT' };
/* the same light formatting the page scripts use: **bold** and `code` */
const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
const para = b => (Array.isArray(b) ? b : [b]).map(p => /^- /.test(p) ? `<ul>${p.split('\n').map(l => `<li>${fmt(l.replace(/^- /, ''))}</li>`).join('')}</ul>` : `<p>${fmt(p)}</p>`).join('');

/* ---------- Skill Mode ---------- */
function assignment(T, a, i) {
  const g = a.guidance || 'A';
  const lists = [
    a.brief ? `<p class="brief">${esc(a.brief)}</p>` : '',
    a.req && a.req.length ? `<div class="reqlbl">${g === 'B' ? 'Requirements' : 'Work out'}</div><ul class="req">${a.req.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '',
    a.steps && a.steps.length ? `<ol>${a.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : '',
    a.deliverables && a.deliverables.length ? `<div class="reqlbl">Deliver</div><ul class="req dl">${a.deliverables.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''
  ].join('');
  return `<div class="asg" id="${T.id}-${i}"><h4>${esc(a.t)}</h4><div class="meta"><span class="guide g${g}">${g} · ${GUIDE[g]}</span> ${esc(a.time)} · uses ${esc(a.ds)}</div>${lists}<div class="expect"><b>${g === 'A' || g === 'B' ? 'Expected result' : 'What good looks like'}:</b> ${esc(a.exp)}</div></div>`;
}
function topic(T) {
  const w = T.why;
  const why = w ? `<dl class="whystatic">${w.matters ? `<dt>Why it matters</dt><dd>${esc(w.matters)}</dd>` : ''}${w.failure ? `<dt>Typical production failure</dt><dd>${esc(w.failure)}</dd>` : ''}${w.use ? `<dt>When to use it</dt><dd>${esc(w.use)}</dd>` : ''}${w.avoid ? `<dt>When not to</dt><dd>${esc(w.avoid)}</dd>` : ''}</dl>` : '';
  const mcq = T.ass.filter(q => q.type === 'mcq'), tasks = T.ass.filter(q => q.type === 'task');
  return `<article class="topic" id="${T.id}"><header><h2>${esc(T.name)}</h2>${T.ds.length ? `<div class="ds">Data: ${T.ds.map(d => `<code>${esc(d)}</code>`).join(' ')}</div>` : ''}${why}</header>
<div class="pane"><h3>Assignments</h3>${T.asg.map((a, i) => assignment(T, a, i)).join('')}
${T.int.length ? `<h3>Interview questions</h3><ul class="qlist">${T.int.map(q => `<li>${esc(q.q)}</li>`).join('')}</ul>` : ''}
${mcq.length || tasks.length ? `<h3>Assessment</h3>${mcq.map(q => `<div class="quiz"><p class="q">${esc(q.q)}</p><ul class="opts">${q.o.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>`).join('')}${tasks.map(q => `<div class="quiz"><p class="q">${esc(q.q)}</p><p class="task">${esc(q.hint || '')}</p></div>`).join('')}` : ''}</div></article>`;
}
function level(m, kind) {
  const tag = kind === 'track' ? (m.tag || 'Track') : m.years;
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="learn.html">Learn</a><span aria-hidden="true">/</span>${kind === 'track' ? '<a href="learn.html#tracks">Tracks</a><span aria-hidden="true">/</span>' : ''}<span aria-current="page">${esc(m.name)}</span></nav>`;
  return `${crumbs}<section class="intro"><h1>${esc(m.name)}${tag ? ` <span class="tag ${esc(m.cls)}">${esc(tag)}</span>` : ''}</h1><p>${esc(m.intro || m.tagline || '')}</p>${m.setup ? `<div class="setup"><b>Before you start</b> ${esc(m.setup)}</div>` : ''}</section>
<noscript><p class="small muted">Ticking assignments, tracking readiness, checking quiz answers and opening worked solutions need JavaScript. The assignments themselves are all below.</p></noscript>
<nav class="jump" aria-label="Topics on this page">${m.topicsData.map(T => `<a href="#${T.id}">${esc(T.name.split(':')[0])}</a>`).join('')}</nav>
<div id="topics">${m.topicsData.map(topic).join('\n')}</div>`;
}

/* ---------- Experience Mode ---------- */
function scenario(s, all) {
  const persona = k => (all.personas || []).find(p => p.id === k) || { name: k === 'you' ? 'You' : k, role: '' };
  const initials = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const stage = all.stages.find(x => x.id === s.stage) || { n: '', name: s.stage };
  const skill = k => { const x = all.skills.find(y => y.id === k); return x ? x.name : k; };
  const rep = persona(s.ticket.reporter);
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="../experience.html">Experience</a><span aria-hidden="true">/</span><a href="../experience.html#stage-${s.stage}">Stage ${stage.n}: ${esc(stage.name)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(s.ticket.id)}</span></nav>
<header class="ticket"><div class="tk-top"><span class="tk-kind k-${s.ticket.kind}">${KIND[s.ticket.kind] || 'Ticket'}</span>${s.ticket.severity ? `<span class="sev sev${s.ticket.severity.slice(-1)}">${esc(s.ticket.severity)}</span>` : ''}<span class="tk-id">${esc(s.ticket.id)}</span>${s.type === 'drill' ? '<span class="chip">Drill</span>' : ''}</div>
<h1>${esc(s.title)}</h1><p class="tk-sum">${esc(s.summary)}</p>
<dl class="tk-meta"><div><dt>Reported by</dt><dd>${esc(rep.name)}${rep.role ? `, ${esc(rep.role)}` : ''}</dd></div><div><dt>Opened</dt><dd>${esc(s.ticket.opened)}</dd></div>${s.ticket.due ? `<div><dt>Needed by</dt><dd>${esc(s.ticket.due)}</dd></div>` : ''}${s.ticket.priority ? `<div><dt>Priority</dt><dd>${esc(s.ticket.priority)}</dd></div>` : ''}<div><dt>Time box</dt><dd>${Math.round(s.minutes / 60 * 10) / 10} h</dd></div></dl>
<div class="tk-skills">${s.skills.map(k => `<span class="chip">${esc(skill(k))}</span>`).join('')}</div></header>
${s.story ? `<div class="story"><b>Previously at Northwind</b>${para(s.story)}</div>` : ''}
<div class="impact"><b>Why the business cares</b> ${fmt(s.impact)}</div>
<noscript><p class="small muted">Taking the ticket, saving notes and deliverables, hints, the rubric and the model answer need JavaScript. The brief and the files are below.</p></noscript>
<section class="xppane" aria-labelledby="brief-h"><h2 class="xph" id="brief-h">Brief</h2><div class="inbox">${s.messages.map(m => { const p = persona(m.from); return `<article class="msg via-${esc(m.via)}"><header><span class="av" aria-hidden="true">${esc(initials(p.name))}</span><span class="who"><b>${esc(p.name)}</b><span>${esc(p.role)}</span></span><span class="when"><span class="via">${esc(m.via)}</span> ${esc(m.at)}</span></header>${m.subject ? `<h3>${esc(m.subject)}</h3>` : ''}<div class="body">${para(m.body)}</div></article>`; }).join('')}</div>
<h2 class="xph">What you are expected to do</h2><ul class="tasks">${s.tasks.map(t => `<li>${fmt(t)}</li>`).join('')}</ul>
<h2 class="xph">Deliverables</h2><ul class="dels">${s.deliverables.map(d => `<li>${fmt(d.t)}</li>`).join('')}</ul>
<h2 class="xph">Evidence</h2><ul class="evlist">${s.evidence.map(e => `<li id="ev-${esc(e.id)}"><b>${e.kind === 'file' ? `<a href="../${esc(e.file)}" download>${esc(e.title)}</a>` : esc(e.title)}</b>${e.desc ? ` <span class="small muted">${fmt(e.desc)}</span>` : ''}</li>`).join('')}</ul></section>`;
}

/* ---------- Toolkit Library (resources.html) ---------- */
function library(all) {
  const groups = [...new Set(all.glossary.map(g => g.c))];
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="toolkit.html">Toolkit</a><span aria-hidden="true">/</span><span aria-current="page">Library</span></nav>
<section class="intro"><h1>Library</h1><p>Everything you look things up in: the glossary, professional templates, printable cheat sheets, a curated catalog of external resources, a ready-made Power BI project and the practice datasets.</p></section>
<noscript><p class="small muted">Filtering the catalog, previewing datasets and copying CSVs need JavaScript. Everything is linked below.</p></noscript>
<section class="sect" id="tools"><h2>Study tools</h2><ul><li><a href="flashcards.html">Interview flashcards</a></li><li><a href="flashcards.html#mock">Mock interview</a></li><li><a href="glossary.html">Glossary</a></li><li><a href="cheatsheet.html">Cheat sheets</a></li><li><a href="templates.html">Professional templates</a></li><li><a href="diagnostic.html">Diagnostic</a></li><li><a href="learn.html#certs">Certification map</a></li></ul></section>
<section class="sect" id="glossary"><h2>Glossary</h2>${groups.map(c => `<h3>${esc(c)}</h3><p>${all.glossary.filter(g => g.c === c).sort((a, b) => a.t.localeCompare(b.t)).map(g => `<a href="glossary.html#${slug(g.t)}">${esc(g.t)}</a>`).join(' · ')}</p>`).join('')}</section>
${(all.templates || []).length ? `<section class="sect" id="templates"><h2>Professional templates</h2><ul>${all.templates.map(t => `<li><a href="templates.html#tpl-${esc(t.id)}">${esc(t.title)}</a>: ${esc(t.summary)}</li>`).join('')}</ul></section>` : ''}
${all.external ? `<section class="sect" id="external"><h2>External resources</h2><ul>${all.external.items.map(x => `<li><a href="${esc(x.u)}" rel="noopener" target="_blank">${esc(x.t)}</a>: ${esc(x.d)}</li>`).join('')}</ul></section>` : ''}
<section class="sect" id="datasets"><h2>Course datasets</h2><ul>${all.datasets.map(d => `<li><a href="data/${esc(d.key)}.csv" download>${esc(d.name)}</a>: ${esc(d.desc)}</li>`).join('')}</ul></section>
<section class="sect" id="starter"><h2>Starter Power BI project</h2><p><a href="starter/northwind-starter.zip" download>Download the Northwind starter project (PBIP)</a></p></section>`;
}

/* ---------- Glossary (glossary.html fills the same list when its script runs) ---------- */
function glossary(all) {
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let html = '', cur = '';
  for (const g of [...all.glossary].sort((a, b) => a.t.localeCompare(b.t))) {
    const L = g.t[0].toUpperCase(); if (L !== cur) { cur = L; html += `<div class="letter" id="letter-${L}">${L}</div>`; }
    html += `<article class="g" id="${slug(g.t)}"><h2>${esc(g.t)} <span class="c">${esc(g.c)}</span></h2><p>${esc(g.d)}</p>${(g.k && g.k.length) || (g.s && g.s.length) ? `<div class="meta">${g.k && g.k.length ? `<div>Also written as: ${g.k.map(esc).join(', ')}</div>` : ''}${g.s && g.s.length ? `<div>See also: ${g.s.map(x => `<a href="#${slug(x)}">${esc(x)}</a>`).join(', ')}</div>` : ''}</div>` : ''}</article>`;
  }
  return html;
}

module.exports = { level, scenario, library, glossary, fmt, para };
