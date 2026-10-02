/* Generated pages: one per Skill Mode module (levels and tracks) plus resources.html, all from the same
   template, and the shared navigation injected into hand-written pages. */
'use strict';
const fs = require('fs'), path = require('path');
const P = require('./partials');
const root = path.join(__dirname, '..', '..', 'site');

const STATIC_WITH_NAV = ['index.html', 'learn.html', 'experience.html', 'progress.html', 'diagnostic.html', 'templates.html', 'flashcards.html', 'glossary.html', 'cheatsheet.html'];

function modulePage(m, kind) {
  const isTrack = kind === 'track';
  const title = m.id === 'resources' ? 'Resources: study tools, glossary, templates and datasets · Power BI Holy Grail'
    : isTrack ? `${m.name}: hands-on track · Power BI Holy Grail` : `${m.name} Power BI: assignments with worked solutions · Power BI Holy Grail`;
  const description = m.seo || (m.id === 'resources' ? 'Every study tool in one place: flashcards, mock interview, glossary, cheat sheets, professional templates, the starter Power BI project (PBIP) and the Northwind Outdoors practice datasets.'
    : `${m.name}: ${m.tagline || 'hands-on assignments'} Each assignment has a checkable expected result and a worked solution.`);
  const isRes = m.id === 'resources', sec = isRes ? 'resources' : 'learn';
  const scripts = ['content', 'tracks', ...(isTrack ? ['solutions-tracks'] : []), 'solutions', 'glossary', ...(isRes ? ['templates'] : []), 'external', 'meta', 'site', 'progress', 'course', 'levelpage'];
  return `${P.head({ title, description, path: m.id + '.html' })}
<body data-page="${m.id}">
<a class="skip" href="#app">Skip to content</a>
<!--nav:${sec}-->
${P.nav(sec)}
<!--/nav-->
<main class="wrap" id="app" tabindex="-1"><noscript><p>This page needs JavaScript to show the assignments. Everything else on the site, including the datasets in the <a href="https://github.com/sudhanshumukherjeexx/power-bi/tree/main/site/data">data folder on GitHub</a>, works without it.</p></noscript></main>
${P.footer()}
${scripts.map(s => `<script src="assets/js/${s}.js"></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = (all) => {
  const out = {};
  for (const m of all.modules) out[m.id + '.html'] = modulePage(m, m.kind);
  out['resources.html'] = modulePage({ id: 'resources', name: 'Resources' }, 'level');
  for (const f of STATIC_WITH_NAV) {
    const file = path.join(root, f);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('<!--nav:')) continue;
    out[f] = P.inject(html);
  }
  return out;
};
module.exports.STATIC_WITH_NAV = STATIC_WITH_NAV;
