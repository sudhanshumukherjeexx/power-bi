/* Dataset assertions: every fact in content/datasets/datasets.json (and the scenario packs) holds for the CSVs,
   and the generators reproduce the committed files byte for byte. */
'use strict';
const fs = require('fs'), path = require('path');
const csv = require('../tools/lib/csv');
const { root, site } = require('./lib/util');

function profileCheck(t, label, file, p, tables) {
  const { cols, rows } = tables(file);
  const ci = c => { const i = cols.indexOf(c); t.ok(i >= 0, `${label}: no column "${c}"`); return i; };
  const col = c => { const i = ci(c); return i < 0 ? [] : rows.map(r => r[i]); };
  if (p.rows !== undefined) t.eq(rows.length, p.rows, `${label}: row count`);
  for (const c of p.unique || []) { const v = col(c); t.eq(new Set(v).size, v.length, `${label}.${c}: values must be unique`); }
  for (const [c, n] of Object.entries(p.distinct || {})) t.eq(new Set(col(c)).size, n, `${label}.${c}: distinct values`);
  for (const [c, n] of Object.entries(p.nulls || {})) t.eq(col(c).filter(v => v === '' || v === undefined).length, n, `${label}.${c}: blank values`);
  if (p.duplicateRows !== undefined) t.eq(rows.length - new Set(rows.map(r => r.join('\u0001'))).size, p.duplicateRows, `${label}: exact duplicate rows`);
  for (const [c, [lo, hi]] of Object.entries(p.range || {})) {
    const v = col(c).filter(x => x !== '').map(x => isNaN(+x) || /\d{4}-\d\d/.test(x) ? x : +x).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    t.eq(v[0], lo, `${label}.${c}: minimum`); t.eq(v[v.length - 1], hi, `${label}.${c}: maximum`);
  }
  for (const k of p.count || []) {
    const v = col(k.col);
    const n = v.filter(x => k.blank ? x === '' : k.eq !== undefined ? x === k.eq : k.lt !== undefined ? x !== '' && +x < k.lt : k.gt !== undefined ? x !== '' && +x > k.gt : k.match ? new RegExp(k.match).test(x) : false).length;
    t.eq(n, k.n, `${label}.${k.col}: count where ${JSON.stringify(Object.fromEntries(Object.entries(k).filter(([x]) => !['col', 'n', 'why'].includes(x))))}${k.why ? ' (' + k.why + ')' : ''}`);
  }
  for (const k of p.fk || []) {
    const [rt, rc] = k.ref.split('.');
    const target = tables(path.join(path.dirname(file), rt + '.csv'));
    const ri = target.cols.indexOf(rc);
    if (!t.ok(ri >= 0, `${label}.${k.col}: referenced column ${k.ref} not found`)) continue;
    const keys = new Set(target.rows.map(r => r[ri]));
    const orphans = col(k.col).filter(v => v !== '' && !keys.has(v)).length + (k.orphans !== undefined ? col(k.col).filter(v => v === '').length : 0);
    t.eq(orphans, k.orphans || 0, `${label}.${k.col} → ${k.ref}: rows without a match${k.why ? ' (' + k.why + ')' : ''}`);
  }
}

module.exports = t => {
  const cache = {};
  const tables = f => cache[f] || (cache[f] = csv.read(f));
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'content/datasets/datasets.json'), 'utf8'));
  for (const d of meta) {
    const f = path.join(site, 'data', d.key + '.csv');
    if (!t.ok(fs.existsSync(f), `data/${d.key}.csv is missing`)) continue;
    profileCheck(t, d.key, f, d.profile, tables);
  }
  /* scenario and track packs declare their own profiles */
  for (const packFile of ['content/experience/datasets.json', 'content/datasets/tracks.json']) {
    const pf = path.join(root, packFile);
    if (!fs.existsSync(pf)) continue;
    for (const d of JSON.parse(fs.readFileSync(pf, 'utf8'))) {
      const f = path.join(site, d.file);
      if (!t.ok(fs.existsSync(f), `${d.file} is missing`)) continue;
      if (d.profile) profileCheck(t, d.file, f, d.profile, tables);
    }
  }
  /* generators reproduce the committed files exactly */
  const gen = require('../tools/generate-data').outputs();
  for (const [r, text] of Object.entries(gen)) {
    const f = path.join(site, r);
    t.ok(fs.existsSync(f) && fs.readFileSync(f, 'utf8') === text, `${r} differs from its generator. Run: node tools/generate-data.js`);
  }
};
module.exports.profileCheck = profileCheck;
