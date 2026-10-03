/* Shared HTML fragments: <head>, the main navigation and the footer. Used for generated pages and injected
   into hand-written pages between <!--nav:SECTION--> and <!--/nav--> markers. */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const site = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SECTIONS = [['learn', 'Learn', 'learn.html'], ['practice', 'Practice', 'experience.html'], ['interview', 'Interview', 'flashcards.html'], ['toolkit', 'Toolkit', 'toolkit.html'], ['progress', 'Progress', 'progress.html'], ['resources', 'Resources', 'resources.html']];

function nav(active, r = '') {
  return `<header class="top gnav"><div class="in">
  <a class="brand" href="${r}index.html" aria-label="${esc(site.name)}: home"><span class="mark" aria-hidden="true">BI</span><span class="bt">${esc(site.name)}</span></a>
  <nav class="mainnav" aria-label="Main">${SECTIONS.map(([id, label, href]) => `<a href="${r}${href}"${id === active ? ' aria-current="true"' : ''}>${label}</a>`).join('')}</nav>
  <span class="sp"></span>
  <button class="btn iconbtn" type="button" data-open-search aria-label="Search (press /)" title="Search (/)"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></button>
  <span data-theme-toggle-slot></span>
</div></header>`;
}

function head({ title, description, path: pagePath = '', r = '', css = ['tokens', 'site', 'pages', 'app'], extra = '' }) {
  const url = site.url + pagePath;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
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
  <p>Your progress is saved in this browser only. <a href="${r}progress.html">See your progress</a> · <a href="${r}toolkit.html">Toolkit</a> · <a href="${r}resources.html">Resources</a> · <a href="${r}glossary.html">Glossary</a> · <a href="${r}templates.html">Templates</a> · <a href="${site.repo}">Source on GitHub</a></p>
  <div class="row"><button class="btn sm" type="button" data-export>Export progress</button><button class="btn sm" type="button" data-import>Import progress</button><button class="btn sm" type="button" data-install hidden>Install app</button></div>
  <p class="small muted">Northwind Outdoors is a fictional company. All data is synthetic and generated from a fixed seed, so every learner sees the same numbers.</p>
</footer>
<div class="toast" id="toast" role="status"></div>`;
}

/* replace <!--nav:SECTION-->…<!--/nav--> in a hand-written page */
function inject(html, r = '') {
  return html.replace(/<!--nav:([a-z]+)-->[\s\S]*?<!--\/nav-->/g, (_, sec) => `<!--nav:${sec}-->\n${nav(sec, r)}\n<!--/nav-->`);
}

module.exports = { site, esc, nav, head, footer, inject, SECTIONS };
