/* The enterprise generator injects exactly the configured number of each defect and is reproducible. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { generate } = require('../tools/generate-enterprise-data');
const csv = require('../tools/lib/csv');

module.exports = async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pbi-ent-'));
  try {
    const m = await generate({ rows: 50000, out: dir });
    const { cols, rows } = csv.read(path.join(dir, 'fact_sales.csv'));
    const ci = n => cols.indexOf(n);
    const cust = new Set(csv.read(path.join(dir, 'dim_customer.csv')).rows.map(r => r[0]));
    t.eq(rows.length, 50000, 'fact rows');
    t.eq(rows.length - new Set(rows.map(r => r.join('|'))).size, m.defects.duplicate_rows, 'duplicate rows');
    t.eq(rows.filter(r => r[ci('Qty')] === '').length, m.defects.null_qty, 'null Qty');
    t.eq(rows.filter(r => !cust.has(r[ci('CustomerKey')])).length, m.defects.invalid_customer_keys, 'invalid customer keys');
    t.eq(rows.filter(r => r[ci('OrderDate')] > '2026-03-31').length, m.defects.future_dated, 'future-dated rows');
    t.eq(rows.filter(r => (Date.parse(r[ci('LoadDate')]) - Date.parse(r[ci('OrderDate')])) / 86400000 >= 8).length, m.defects.late_arrivals, 'late-arriving rows');
    const again = fs.mkdtempSync(path.join(os.tmpdir(), 'pbi-ent-'));
    await generate({ rows: 50000, out: again });
    t.ok(fs.readFileSync(path.join(dir, 'fact_sales.csv'), 'utf8') === fs.readFileSync(path.join(again, 'fact_sales.csv'), 'utf8'), 'same seed and size must give identical files');
    fs.rmSync(again, { recursive: true, force: true });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};
