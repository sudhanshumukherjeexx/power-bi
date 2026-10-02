/* Curriculum correctness: numbers quoted in expected results and worked-solution checks must equal the
   values recomputed from the datasets (tests/curriculum/facts.js). Track SQL answers are executed too
   (tests/sql.test.js). Uncovered numbers in expected results produce warnings so they get a claim. */
'use strict';
const path = require('path');
const load = require('../tools/lib/load');
const { F, FMT } = require('./curriculum/facts');
const { root } = require('./lib/util');

module.exports = t => {
  const spec = load.readJSON(path.join(root, 'tests/curriculum/assertions.json'));
  const a = load.all();
  const asg = {};
  a.modules.forEach(m => m.topicsData.forEach(T => T.asg.forEach((x, i) => asg[`${T.id}-${i}`] = x)));
  const field = (id, where) => where === 'exp' ? asg[id] && asg[id].exp : where === 'steps' ? asg[id] && asg[id].steps.join(' ') : a.solutions[id] && a.solutions[id][where];

  const rendered = {};
  for (const c of spec.claims) {
    if (!t.ok(!!asg[c.id], `assertion for unknown assignment ${c.id}`)) continue;
    if (!t.ok(typeof F[c.fact] === 'function', `${c.id}: unknown fact "${c.fact}"`)) continue;
    if (!t.ok(!!FMT[c.fmt], `${c.id}: unknown format "${c.fmt}"`)) continue;
    let value;
    try { value = F[c.fact](...(c.args || [])); } catch (e) { t.ok(false, `${c.id}: fact ${c.fact} crashed: ${e.message}`); continue; }
    const want = c.text.replace('{}', FMT[c.fmt](value));
    const text = field(c.id, c.in) || '';
    t.ok(text.includes(want), `${c.id} (${c.in}): expected the text to say "${want}" (computed from the data), but it says: "${text.slice(0, 220)}"`);
    (rendered[c.id] = rendered[c.id] || []).push(want);
  }

  /* the six contradictions found in the 2026-10-01 audit stay fixed */
  for (const [id, fact] of [['b-pq-0', 'qtyNulls'], ['b-dax-3', 'returnLines'], ['b-model-2', 'regionMismatchLines'], ['b-dax-1', 'ordersByChannelSum'], ['a-dax-0', 'belowReorderNames'], ['i-pq-3', 'ratesFound']])
    t.ok(spec.claims.some(c => c.id === id && c.in === 'exp' && c.fact === fact), `${id}: the expected result must keep a claim on ${fact} (audit regression)`);

  /* numbers in expected results that no claim covers. Track topics write data numbers as {{fact}} placeholders
     (filled from the generated data at build time), so only the literal numbers in their raw text are checked. */
  const rawExp = {};
  a.modules.filter(m => m.kind === 'track').forEach(m => m.topicsData.forEach(T => {
    const raw = load.readJSON(path.join(root, T._file));
    raw.asg.forEach((x, i) => rawExp[`${T.id}-${i}`] = x.exp.replace(/\{\{[^}]+\}\}/g, ' '));
  }));
  for (const [id, x0] of Object.entries(asg)) {
    const x = rawExp[id] !== undefined ? { exp: rawExp[id] } : x0;
    /* whole numbers, 1,234 style thousands and decimals; skip pieces of dates like 09-01-2026 */
    const nums = (x.exp.replace(/\b\d{1,4}[-/]\d{1,2}[-/]\d{2,4}\b/g, ' ').match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) || []);
    const covered = (rendered[id] || []).join(' ');
    const ign = (spec.ignore[id] || {}).numbers || [];
    const isTrack = rawExp[id] !== undefined;
    for (const n of nums) if (!covered.includes(n) && !ign.includes(n) && !(isTrack && (/^20\d\d$/.test(n) || (/^\d+$/.test(n) && +n <= 31)))) t.warn(`${id}: expected result quotes "${n}" with no data assertion (add one to tests/curriculum/assertions.json, or an ignore entry with a reason)`);
  }
};
