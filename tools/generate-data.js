/* Regenerates every CSV in data/ from the seeded generators. Output is byte-for-byte reproducible.
   Usage (from the project root):  node tools/generate-data.js [--check]
     --check   do not write; exit 1 if any file on disk differs from what the generators produce */
'use strict';
const fs = require('fs'), path = require('path');
const csv = require('./lib/csv');
const root = path.join(__dirname, '..');

function outputs() {
  const out = {};
  const DS = require('./lib/course-data');
  for (const [key, ds] of Object.entries(DS)) out[`data/${key}.csv`] = csv.stringify(ds.cols, ds.rows);
  const extra = [
    () => require('./lib/company-data').files(),
    () => require('./lib/track-data').files()
  ];
  for (const fn of extra) { let files; try { files = fn(); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && /company-data|track-data/.test(e.message)) continue; throw e; } Object.assign(out, files); }
  return out;
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const out = outputs(); let bad = 0;
  for (const [rel, text] of Object.entries(out)) {
    const file = path.join(root, rel);
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (cur === text) continue;
    if (check) { console.error('out of date: ' + rel); bad++; continue; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    console.log('wrote ' + rel);
  }
  if (check && bad) { console.error(bad + ' data file(s) differ. Run: node tools/generate-data.js'); process.exit(1); }
  if (!check) console.log(Object.keys(out).length + ' data files up to date');
}
module.exports = { outputs };
