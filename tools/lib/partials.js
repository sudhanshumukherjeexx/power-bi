/* Shared HTML fragments: <head>, the main navigation and the footer. Used for generated pages and injected
   into hand-written pages between <!--nav:SECTION--> and <!--/nav--> markers. */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const site = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Top-level destinations. "practice" is the section id hand-written pages already use; its label is Experience.
   Pages of the old Resources section (glossary, cheat sheet, library) belong to the Toolkit. */
const SECTIONS = [['learn', 'Learn', 'learn.html'], ['practice', 'Experience', 'experience.html'], ['interview', 'Interview', 'flashcards.html'], ['toolkit', 'Toolkit', 'toolkit.html'], ['progress', 'Progress', 'progress.html']];
const ALIAS = { resources: 'toolkit' };
/* On narrow screens Progress moves into More, beside the pages people reach for between lessons. */
const MORE = [['progress', 'Progress', 'progress.html'], ['glossary', 'Glossary', 'glossary.html'], ['library', 'Library', 'resources.html'], ['templates', 'Templates', 'templates.html']];

function nav(active, r = '', page = '') {
  const sec = ALIAS[active] || active;
  const inMore = ([id, , href]) => href === page || (id === 'progress' && sec === 'progress');
  const moreCur = MORE.some(inMore);
  return `<header class="top gnav"><div class="in">
  <a class="brand" href="${r}index.html" aria-label="${esc(site.name)}: home"><span class="mark" aria-hidden="true">BI</span><span class="bt">${esc(site.name)}</span></a>
  <nav class="mainnav" aria-label="Main">${SECTIONS.map(([id, label, href]) => `<a href="${r}${href}"${id === sec ? ` aria-current="${href === page ? 'page' : 'true'}"` : ''}${id === 'progress' ? ' class="nav-wide"' : ''}>${label}</a>`).join('')}<details class="navmore"><summary${moreCur ? ' class="cur"' : ''}>More<span class="vh"> pages</span></summary><div class="navmenu">${MORE.map(m => `<a href="${r}${m[2]}"${inMore(m) ? ' aria-current="page"' : ''}>${m[1]}</a>`).join('')}<hr><button type="button" data-export>Export progress</button><button type="button" data-import>Import progress</button></div></details></nav>
  <span class="sp"></span>
  <button class="btn iconbtn" type="button" data-open-search aria-label="Search (press /)" title="Search (/)"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></button>
  <span data-theme-toggle-slot></span>
</div></header>`;
}

/* canonical URL, Open Graph, Twitter card and the social image: the same block for generated pages and, via
   seoInject, for hand-written ones */
const OG_IMAGE = 'assets/og/og-default.png';
/* Cloudflare Web Analytics, only when a site token is configured in content/site.json. The token is public. The
   loader (assets/js/analytics.js) respects Do Not Track, Global Privacy Control and the opt-out on the progress page. */
const analytics = () => { const a = site.analytics || {}; return a.provider === 'cloudflare' && /^[a-f0-9]{32}$/.test(a.token || '') ? a.token : null; };
function seo({ title, description, path: pagePath = '', type = 'website' }) {
  const url = site.url + pagePath;
  return `<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(site.url + OG_IMAGE)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.name)}: ${esc(site.tagline)}">
<meta name="twitter:card" content="summary_large_image">${analytics() ? `
<meta name="pbi-analytics" content="cloudflare:${analytics()}">
<script defer src="${pagePath.split('/').slice(1).map(() => '../').join('')}assets/js/analytics.js"></script>` : ''}`;
}
/* structured data: only types that describe the page accurately (Course, LearningResource, TechArticle, BreadcrumbList) */
const ld = objs => (objs || []).filter(Boolean).map(o => `<script type="application/ld+json">${JSON.stringify(Object.assign({ '@context': 'https://schema.org' }, o)).replace(/</g, '\\u003c')}</script>`).join('\n');
const crumbsLd = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + p })) });

function head({ title, description, path: pagePath = '', r = '', css = ['tokens', 'site', 'base', 'pages', 'app'], extra = '', type = 'website', jsonld = null }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${seo({ title, description, path: pagePath, type })}${jsonld ? '\n' + ld(jsonld) : ''}
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15181D" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${esc(site.short)}">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="${r}manifest.webmanifest">
<link rel="icon" href="${r}assets/icons/icon.svg" type="image/svg+xml">
<link rel="icon" href="${r}assets/icons/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${r}assets/icons/apple-touch-icon.png">
${css.map(c => `<link rel="stylesheet" href="${r}assets/css/${c}.css">`).join('\n')}${extra ? '\n' + extra : ''}
</head>`;
}

function footer(r = '', note = '') {
  return `<footer class="wrap foot">
  ${note ? `<p>${note}</p>` : ''}
  <p>Your progress is saved in this browser only. <a href="${r}progress.html">See your progress</a> · <a href="${r}toolkit.html">Toolkit</a> · <a href="${r}resources.html">Library</a> · <a href="${r}glossary.html">Glossary</a> · <a href="${r}templates.html">Templates</a> · <a href="${site.repo}">Source on GitHub</a></p>
  <div class="row"><button class="btn sm" type="button" data-export>Export progress</button><button class="btn sm" type="button" data-import>Import progress</button><button class="btn sm" type="button" data-install hidden>Install app</button></div>
  <p class="small muted">Northwind Outdoors is a fictional company. All data is synthetic and generated from a fixed seed, so every learner sees the same numbers.</p>
</footer>
<div class="toast" id="toast" role="status"></div>`;
}

/* replace <!--nav:SECTION-->…<!--/nav--> in a hand-written page */
function inject(html, r = '', page = '') {
  return html.replace(/<!--nav:([a-z]+)-->[\s\S]*?<!--\/nav-->/g, (_, sec) => `<!--nav:${sec}-->\n${nav(sec, r, page)}\n<!--/nav-->`);
}

module.exports = { site, esc, nav, head, seo, ld, crumbsLd, footer, inject, SECTIONS, OG_IMAGE, analytics };
