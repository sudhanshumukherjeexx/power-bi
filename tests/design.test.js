/* The design system stays a system (docs/design-audit.md, docs/implementation-plan.md):
   - colours, type and shape are defined only in assets/css/tokens.css (404.html is self-contained by necessity);
   - no third-party font or style requests: IBM Plex is self-hosted and licensed;
   - every page loads tokens.css first;
   - every icon a page or script draws exists in the sprite;
   - no emoji in UI chrome (scenario dialogue may use them; it's what people type);
   - border radii stay on the scale (≤ 8px, or pills and circles). */
'use strict';
const fs = require('fs'), path = require('path');
const { site, walk, rel } = require('./lib/util');
const icons = require('../tools/lib/icons');

module.exports = t => {
  const css = walk(path.join(site, 'assets/css'), p => p.endsWith('.css'));
  const html = walk(site, p => p.endsWith('.html'));
  const inlineCss = f => [...fs.readFileSync(f, 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const TOKENS = ['--bg', '--surface-1', '--text-primary', '--grail-gold', '--panel', '--ink', '--yellow', '--line'];

  /* one token source */
  for (const f of css.filter(f => !f.endsWith('tokens.css'))) {
    const s = fs.readFileSync(f, 'utf8');
    for (const k of TOKENS) t.ok(!new RegExp(`(^|[;{\\s])${k}\\s*:`).test(s), `${rel(f)} defines ${k}; tokens live in tokens.css`);
  }
  for (const f of html.filter(f => !f.endsWith('404.html'))) {
    const s = inlineCss(f);
    for (const k of TOKENS) t.ok(!new RegExp(`(^|[;{\\s])${k}\\s*:`).test(s), `${rel(f)} redefines ${k} inline`);
  }

  /* every page loads tokens.css before any other stylesheet, and nothing from a font CDN */
  for (const f of html) {
    const s = fs.readFileSync(f, 'utf8');
    t.ok(!/fonts\.(googleapis|gstatic)\.com/.test(s), `${rel(f)} requests Google Fonts`);
    if (f.endsWith('404.html')) continue;
    const sheets = [...s.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1]);
    t.ok(sheets.length && /assets\/css\/tokens\.css$/.test(sheets[0]), `${rel(f)} must load tokens.css first (got ${sheets[0]})`);
  }
  const sw = fs.readFileSync(path.join(site, 'sw.js'), 'utf8');
  t.ok(!/googleapis|gstatic/.test(sw), 'service worker no longer special-cases Google Fonts');

  /* fonts: every @font-face file exists, is precached, and the licence ships with them */
  const tok = fs.readFileSync(path.join(site, 'assets/css/tokens.css'), 'utf8');
  const faces = [...tok.matchAll(/url\(\.\.\/fonts\/([^)]+)\)/g)].map(m => m[1]);
  t.ok(faces.length >= 6, 'IBM Plex faces declared');
  for (const f of faces) {
    t.ok(fs.existsSync(path.join(site, 'assets/fonts', f)), `font file missing: ${f}`);
    t.ok(sw.includes(`assets/fonts/${f}`), `font not precached: ${f}`);
  }
  t.ok(fs.existsSync(path.join(site, 'assets/fonts/OFL.txt')), 'SIL Open Font License ships with the fonts');

  /* icons: the sprite is current and every reference resolves */
  const sprite = fs.readFileSync(path.join(site, 'assets/icons/icons.svg'), 'utf8');
  t.eq(sprite, icons.sprite(), 'icons.svg matches tools/lib/icons.js');
  const known = new Set(icons.names);
  const sources = [...html, ...walk(path.join(site, 'assets/js'), p => p.endsWith('.js'))];
  let refs = 0;
  for (const f of sources) for (const m of fs.readFileSync(f, 'utf8').matchAll(/icons\.svg#([A-Za-z]+)/g)) { refs++; t.ok(known.has(m[1]), `${rel(f)}: unknown icon #${m[1]}`); }
  t.ok(refs >= 10, `icons are in use (${refs} references)`);
  const doors = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content/toolkit/index.json'), 'utf8')).doors;
  doors.forEach(d => t.ok(known.has(d.icon), `Toolkit door ${d.id}: unknown icon "${d.icon}"`));

  /* no emoji in UI chrome; scenario content (experience.js) and data are dialogue, not chrome */
  const EMOJI = /\p{Extended_Pictographic}/u;
  const chrome = [...html.filter(f => !/[\\/]experience[\\/]/.test(f)), ...['home', 'learn', 'levelpage', 'xphub', 'xp', 'tkhub', 'tkguide', 'progresspage', 'course', 'site', 'tplpage', 'diagnostic'].map(n => path.join(site, `assets/js/${n}.js`))];
  for (const f of chrome) {
    const s = fs.readFileSync(f, 'utf8').replace(/[☐☑↔↗→←↑↓⇄✓○●–—]/g, '');
    const m = s.match(EMOJI);
    t.ok(!m, `${rel(f)} has an emoji in UI chrome: ${m && m[0]}`);
  }

  /* the 2.0 token names are gone for good (404.html is self-contained and keeps its own small set) */
  const OLD = /var\(--(panel|panel-2|ink|ink-2|ink-3|line|line-2|yellow|yellow-ink|yellow-soft|yellow-c|hl-ink|ink-hl|code-ink|ok|ok-soft|bad|bad-soft|beg|int|adv|sql|dw|qa|api|gov|fab|mod|radius|shadow)[,)]/;
  for (const f of [...css, ...html.filter(f => !f.endsWith('404.html')), ...walk(path.join(site, 'assets/js'), p => p.endsWith('.js'))]) {
    const m = fs.readFileSync(f, 'utf8').match(OLD);
    t.ok(!m, `${rel(f)} uses the retired token ${m && m[0]}; use the tokens.css name (see CONTRIBUTING, Design rules)`);
  }
  /* one shared base: every page loads base.css, and no page repeats one of its rules inline */
  const ruleMap = s => { const m = {}; s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{([^{}]*\{[^}]*\})*\s*\}/g, '').replace(/([^{}]+)\{([^}]*)\}/g, (_, a, b) => { m[a.trim()] = b.trim(); return ''; }); return m; };
  const baseRules = ruleMap(fs.readFileSync(path.join(site, 'assets/css/base.css'), 'utf8'));
  for (const f of html.filter(f => !f.endsWith('404.html'))) {
    t.ok(/assets\/css\/base\.css/.test(fs.readFileSync(f, 'utf8')), `${rel(f)} must load base.css`);
    const inline = ruleMap(inlineCss(f));
    const dup = Object.keys(inline).filter(k => baseRules[k] === inline[k]);
    t.ok(!dup.length, `${rel(f)} repeats base.css rules inline: ${dup.slice(0, 4).join(', ')}`);
  }

  /* brand images exist at the sizes GitHub and link previews expect (PNG header: width and height at bytes 16–23) */
  const png = f => { const p = path.join(__dirname, '..', f); if (!fs.existsSync(p)) return null; const b = fs.readFileSync(p); return b.toString('ascii', 1, 4) === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
  for (const [f, w, h] of [['docs/social-preview.png', 1280, 640], ['site/assets/og/og-default.png', 1200, 630], ...['home', 'skill-mode', 'experience-mode', 'toolkit', 'progress'].map(n => [`docs/screenshots/${n}.png`, 1280, 800])]) {
    const d = png(f);
    t.ok(d && d[0] === w && d[1] === h, `${f} must exist as a ${w}×${h} PNG (got ${d ? d.join('×') : 'nothing'}); regenerate with node tools/render-og.js or tools/render-screenshots.js`);
  }

  /* radius scale */
  for (const f of css) for (const m of fs.readFileSync(f, 'utf8').matchAll(/border-radius:\s*([^;}]+)/g)) {
    const px = [...m[1].matchAll(/(\d+(?:\.\d+)?)px/g)].map(x => +x[1]);
    t.ok(px.every(v => v <= 8 || v === 999), `${rel(f)}: border-radius ${m[1]} is off the scale (max 8px, or 999px pills)`);
  }
};
