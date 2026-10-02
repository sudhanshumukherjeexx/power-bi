/* Runs every SQL model answer that declares an expected result (content/solutions/*.json, code[].expect)
   against an in-memory SQLite database loaded with the company pack and the track files, and compares the
   output with the expected rows (which are themselves filled from the generated data). Portable SQL only:
   blocks marked dialect "tsql" are not executed. */
'use strict';
const fs = require('fs'), path = require('path');
const csv = require('../tools/lib/csv');
const load = require('../tools/lib/load');
const { root } = require('./lib/util');

let sqlite;
try { process.removeAllListeners('warning'); sqlite = require('node:sqlite'); } catch (e) { sqlite = null; }

const TABLES = {
  orders: 'data/experience/company/orders.csv', order_lines: 'data/experience/company/order_lines.csv', returns: 'data/experience/company/returns.csv',
  customers: 'data/experience/company/customers.csv', products: 'data/experience/company/products.csv', regions: 'data/experience/company/regions.csv',
  fx_rates: 'data/experience/company/fx_rates.csv', customer_changes: 'data/tracks/warehousing/customer_changes.csv', early_orders: 'data/tracks/warehousing/early_orders.csv',
  order_events: 'data/tracks/warehousing/order_events.csv', web_sessions_local: 'data/tracks/warehousing/web_sessions_local.csv', mini_sales: 'data/tracks/testing/mini_sales.csv'
};

function database() {
  const db = new sqlite.DatabaseSync(':memory:');
  for (const [name, file] of Object.entries(TABLES)) {
    const f = path.join(root, file);
    if (!fs.existsSync(f)) continue;
    const { cols, rows } = csv.read(f);
    const numeric = cols.map((_, i) => rows.every(r => r[i] === '' || /^-?\d+(\.\d+)?$/.test(r[i])));
    const isInt = cols.map((_, i) => numeric[i] && rows.every(r => r[i] === '' || /^-?\d+$/.test(r[i])));
    db.exec(`CREATE TABLE ${name} (${cols.map((c, i) => `"${c}" ${isInt[i] ? 'INTEGER' : numeric[i] ? 'REAL' : 'TEXT'}`).join(', ')})`);
    const ins = db.prepare(`INSERT INTO ${name} VALUES (${cols.map(() => '?').join(',')})`);
    db.exec('BEGIN');
    for (const r of rows) ins.run(...r.map((v, i) => v === '' ? null : numeric[i] ? Number(v) : v));
    db.exec('COMMIT');
  }
  return db;
}

const same = (a, b) => {
  const na = Number(String(a).replace(/[,$]/g, '')), nb = Number(String(b).replace(/[,$]/g, ''));
  if (a !== null && b !== null && String(a).trim() !== '' && !isNaN(na) && !isNaN(nb)) return Math.abs(na - nb) <= Math.max(0.02, Math.abs(nb) * 1e-6);
  return String(a) === String(b);
};

module.exports = t => {
  if (!sqlite) { t.warn('node:sqlite not available (Node 22.5+ needed); SQL answers not executed'); return; }
  const db = database();
  const sols = load.solutions();
  let ran = 0;
  for (const [id, s] of Object.entries(sols)) {
    (s.code || []).forEach((c, i) => {
      if (!c.expect || !/^sql$/i.test(c.lang) || c.dialect === 'tsql') return;
      ran++;
      const sql = c.src.join('\n');
      const statements = sql.split(/;\s*(?:\n|$)/).map(x => x.trim()).filter(x => x && !/^--/.test(x.split('\n').filter(l => l.trim()).pop() || '--'));
      let res;
      try {
        for (const st of statements.slice(0, -1)) db.exec(st);
        res = db.prepare(statements[statements.length - 1]).all();
      } catch (e) { t.ok(false, `${id} code[${i}] "${c.title}": SQL error: ${e.message}`); return; }
      const got = res.map(r => c.expect.cols.map(col => r[col] === undefined ? `<missing column ${col}>` : r[col]));
      if (!t.ok(got.length === c.expect.rows.length, `${id} "${c.title}": expected ${c.expect.rows.length} row(s), got ${got.length}`)) return;
      c.expect.rows.forEach((row, ri) => row.forEach((v, ci) => t.ok(same(got[ri][ci], v), `${id} "${c.title}" row ${ri + 1} ${c.expect.cols[ci]}: expected ${v}, got ${got[ri][ci]}`)));
    });
  }
  t.ok(ran >= 0);
  if (!ran) t.warn('no SQL answers with expected results found');
};
