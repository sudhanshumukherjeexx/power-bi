/* Generated pages: one per Skill Mode module (levels and tracks) plus resources.html (the Toolkit Library), all from
   the same template with their content rendered statically (tools/lib/static-render.js), and the shared navigation
   and SEO block injected into hand-written pages. */
'use strict';
const fs = require('fs'), path = require('path');
const P = require('./partials');
const SR = require('./static-render');
const root = path.join(__dirname, '..', '..', 'site');

const STATIC_WITH_NAV = ['index.html', 'learn.html', 'experience.html', 'progress.html', 'diagnostic.html', 'templates.html', 'flashcards.html', 'glossary.html', 'cheatsheet.html'];

function modulePage(m, kind, all) {
  const isTrack = kind === 'track';
  const title = m.id === 'resources' ? 'Library: glossary, cheat sheets, datasets and external resources · BI Developer Toolkit · The Power BI Fellowship'
    : isTrack ? `${m.name}: hands-on track · The Power BI Fellowship` : `${m.name} Power BI: assignments with worked solutions · The Power BI Fellowship`;
  const description = m.seo || (m.id === 'resources' ? 'The BI Developer Toolkit library: the Power BI glossary, printable cheat sheets, a curated catalog of external resources, the Northwind Outdoors practice datasets, the starter Power BI project (PBIP) and study tools.'
    : `${m.name}: ${m.tagline || 'hands-on assignments'} Each assignment has a checkable expected result and a worked solution.`);
  const isRes = m.id === 'resources', sec = isRes ? 'toolkit' : 'learn';
  const scripts = ['content', 'tracks', ...(isTrack ? ['solutions-tracks'] : []), 'solutions', 'glossary', ...(isRes ? ['templates'] : []), 'external', 'meta', 'store', 'site', 'progress', 'course', 'levelpage'];
  const crumbs = isRes ? [['Toolkit', 'toolkit.html'], ['Library', 'resources.html']] : [['Learn', 'learn.html'], ...(isTrack ? [['Tracks', 'learn.html#tracks']] : []), [m.name, m.id + '.html']];
  const jsonld = [P.crumbsLd(crumbs), isRes ? null : { '@type': 'LearningResource', name: `${m.name}: Power BI ${isTrack ? 'track' : 'level'}`, description, url: P.site.url + m.id + '.html', learningResourceType: 'Exercise', educationalLevel: isTrack ? 'Specialist' : m.name, inLanguage: 'en', isAccessibleForFree: true, teaches: m.topicsData.map(T => T.name), isPartOf: { '@type': 'Course', name: P.site.name, url: P.site.url } }];
  const body = isRes ? SR.library(all) : SR.level(m, kind);
  return `${P.head({ title, description, path: m.id + '.html', jsonld })}
<body data-page="${m.id}">
<a class="skip" href="#app">Skip to content</a>
<!--nav:${sec}-->
${P.nav(sec, "", m.id + ".html")}
<!--/nav-->
<main class="wrap" id="app" tabindex="-1">
${body}
</main>
${P.footer()}
${scripts.map(s => `<script src="assets/js/${s}.js"></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = (all) => {
  const out = {};
  for (const m of all.modules) out[m.id + '.html'] = modulePage(m, m.kind, all);
  out['resources.html'] = modulePage({ id: 'resources', name: 'Library' }, 'level', all);
  for (const f of STATIC_WITH_NAV) {
    const file = path.join(root, f);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('<!--nav:')) continue;
    let page = seoInject(P.inject(html, "", f), f);
    /* pre-rendered content regions in hand-written pages */
    page = page.replace(/<!--static:glossary-->[\s\S]*?<!--\/static-->/, () => `<!--static:glossary-->${SR.glossary(all)}<!--/static-->`);
    out[f] = page;
  }
  return out;
};
module.exports.STATIC_WITH_NAV = STATIC_WITH_NAV;

/* hand-written pages: replace any canonical / Open Graph / Twitter tags with the shared block, built from the page's
   own <title> and description, so every page has the same complete set */
function seoInject(html, f) {
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1];
  if (!title || !desc) throw new Error(`${f}: needs a <title> and a meta description`);
  const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  html = html.replace(/\n<!--seo-->[\s\S]*?<!--\/seo-->/, '').replace(/\n<link rel="canonical"[^>]*>|\n<meta property="og:[^>]*>|\n<meta name="twitter:[^>]*>/g, '');
  const block = P.seo({ title: un(title), description: un(desc), path: f === 'index.html' ? '' : f });
  const extra = f === 'index.html' ? '\n' + P.ld([{ '@type': 'Course', name: P.site.name, description: P.site.description, url: P.site.url, inLanguage: 'en', isAccessibleForFree: true,
    provider: { '@type': 'Person', name: 'Sudhanshu Mukherjee', url: 'https://github.com/sudhanshumukherjeexx' }, license: 'https://opensource.org/licenses/MIT',
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'Self-paced' } }]) : '';
  return html.replace(/(<meta name="description" content="[^"]*">)/, `$1\n<!--seo-->\n${block}${extra}\n<!--/seo-->`);
}
