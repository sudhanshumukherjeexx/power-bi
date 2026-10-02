'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
/* the published website (what GitHub Pages serves) */
const site = path.join(root, 'site');
/* same djb2 hash the site uses for flashcard ids (PBI.hash in assets/js/site.js) */
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
const walk = (dir, filter, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, filter, out); else if (!filter || filter(p)) out.push(p);
  }
  return out;
};
const rel = p => path.relative(root, p).split(path.sep).join('/');
const today = () => new Date().toISOString().slice(0, 10);
module.exports = { root, site, hash, walk, rel, today };
