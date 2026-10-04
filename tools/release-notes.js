/* Release notes for one version, taken from CHANGELOG.md (the section "## X.Y.Z (date): name" up to the next "## ").
   Usage: node tools/release-notes.js 2.6.0 > notes.md        (then: gh release create v2.6.0 --notes-file notes.md) */
'use strict';
const fs = require('fs'), path = require('path');
const v = (process.argv[2] || '').replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(v)) { console.error('Usage: node tools/release-notes.js X.Y.Z'); process.exit(2); }
const lines = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8').split('\n');
const start = lines.findIndex(l => l.startsWith(`## ${v} (`));
if (start < 0) { console.error(`CHANGELOG.md has no section for ${v}`); process.exit(1); }
let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
if (end < 0) end = lines.length;
const [, date, name] = lines[start].match(/^## \S+ \(([^)]*)\)(?:: (.*))?$/) || [];
const body = lines.slice(start + 1, end).join('\n').trim();
const site = 'https://sudhanshumukherjeexx.github.io/power-bi/';
process.stdout.write(`${name ? `**${name[0].toUpperCase() + name.slice(1)}** · ` : ''}released ${date} · [open the site](${site})\n\n${body}\n\n---\nFull history: [CHANGELOG.md](https://github.com/sudhanshumukherjeexx/power-bi/blob/main/CHANGELOG.md)\n`);
module.exports = { v };
