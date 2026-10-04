/* Runs the SQL examples against a real SQL Server and checks the answers (docs/sql-validation.md, level "sql-server").
   - every executed "portable" worked solution (dialect portable, with expected rows) runs and must return the same
     rows SQLite returns in tests/sql.test.js: "portable" is tested, not claimed;
   - the T-SQL MERGE must load exactly the rows the portable idempotent load expects, and stay the same on a re-run;
   - the T-SQL "rewrite for SQL Server" must return the same number of rows as its portable equivalent, and its
     index DDL must run.
   Tables are the same files the SQLite test uses (tools/lib/sql-tables.js), with date columns typed DATE as in a
   warehouse. Names the T-SQL uses map onto them: synonyms dbo.OrderLines and dbo.FactSales, and stage.OrderLines,
   a de-duplicated view (a staging table holds one row per key).
   Needs SQL Server 2017+ and these environment variables (nothing is stored in the repository):
     MSSQL_SA_PASSWORD  (required)   SQLSERVER_HOST (default localhost)   SQLSERVER_PORT (default 1433)
   Usage: node tools/sqlserver-check.js            CI: .github/workflows/sql-server.yml */
'use strict';
const fs = require('fs'), path = require('path');
const sql = require('mssql');
const csv = require('./lib/csv');
const load = require('./lib/load');
const TABLES = require('./lib/sql-tables');

const password = process.env.MSSQL_SA_PASSWORD;
if (!password) { console.error('Set MSSQL_SA_PASSWORD (and SQLSERVER_HOST / SQLSERVER_PORT if needed).'); process.exit(2); }
const cfg = db => ({ server: process.env.SQLSERVER_HOST || 'localhost', port: +(process.env.SQLSERVER_PORT || 1433), user: 'sa', password, database: db,
  options: { encrypt: true, trustServerCertificate: true }, requestTimeout: 120000, pool: { max: 2 } });
const DB = 'pbi_check';
const results = []; const ok = (c, m) => { results.push((c ? 'PASS ' : 'FAIL ') + m); return c; };
const same = (a, b) => {
  if (a instanceof Date) a = a.toISOString().slice(0, 10);
  const na = Number(String(a).replace(/[,$]/g, '')), nb = Number(String(b).replace(/[,$]/g, ''));
  if (a !== null && b !== null && String(a).trim() !== '' && !isNaN(na) && !isNaN(nb)) return Math.abs(na - nb) <= Math.max(0.02, Math.abs(nb) * 1e-6);
  return String(a) === String(b);
};
const split = src => src.split(/;\s*(?:\n|$)/).map(x => x.trim()).filter(x => x && !/^--/.test(x.split('\n').filter(l => l.trim()).pop() || '--'));

async function loadTables(pool) {
  for (const [name, file] of Object.entries(TABLES)) {
    const { cols, rows } = csv.read(path.join(load.siteDir, file));
    const all = i => rows.every(r => r[i] === '' || r[i] === undefined || r[i] === null || r[i]);
    const isInt = cols.map((_, i) => rows.every(r => r[i] === '' || /^-?\d+$/.test(r[i])) && rows.some(r => r[i] !== ''));
    const isNum = cols.map((_, i) => rows.every(r => r[i] === '' || /^-?\d+(\.\d+)?$/.test(r[i])) && rows.some(r => r[i] !== ''));
    const isDate = cols.map((_, i) => rows.every(r => r[i] === '' || /^\d{4}-\d{2}-\d{2}$/.test(r[i])) && rows.some(r => r[i] !== ''));
    const t = new sql.Table(`dbo.${name}`); t.create = true;
    cols.forEach((c, i) => t.columns.add(c, isInt[i] ? sql.BigInt : isNum[i] ? sql.Float : isDate[i] ? sql.Date : sql.NVarChar(200), { nullable: true }));
    for (const r of rows) t.rows.add(...r.map((v, i) => v === '' || v === undefined ? null : isInt[i] || isNum[i] ? Number(v) : isDate[i] ? new Date(v + 'T00:00:00Z') : v));
    await pool.request().bulk(t);
    all(0);
  }
  /* the names the T-SQL examples use */
  await pool.request().batch('CREATE SYNONYM dbo.OrderLines FOR dbo.order_lines');
  await pool.request().batch('CREATE SCHEMA stage');
  await pool.request().batch('CREATE VIEW stage.OrderLines AS SELECT OrderID, [LineNo], ProductKey, Qty, UnitPrice, DiscountPct FROM (SELECT l.*, ROW_NUMBER() OVER (PARTITION BY OrderID, [LineNo] ORDER BY OrderID) AS rn FROM dbo.order_lines AS l) AS x WHERE rn = 1');
}

async function runBlock(pool, src) {
  const st = split(src); let last;
  /* statements are sent one by one, each with its terminator (MERGE requires it) */
  for (const s of st) last = await pool.request().batch(s + ';');
  return last && last.recordset ? last.recordset : [];
}

(async () => {
  const master = await new sql.ConnectionPool(cfg('master')).connect();
  const ver = (await master.request().query('SELECT @@VERSION AS v')).recordset[0].v.split('\n')[0];
  console.log(ver);
  await master.request().batch(`IF DB_ID('${DB}') IS NOT NULL BEGIN ALTER DATABASE ${DB} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${DB}; END; CREATE DATABASE ${DB};`);
  await master.close();
  const pool = await new sql.ConnectionPool(cfg(DB)).connect();
  await loadTables(pool);

  const sols = load.solutions();
  const expectOf = (key, i) => sols[key] && sols[key].code[i] && sols[key].code[i].expect;
  let n = 0;
  for (const [id, s] of Object.entries(sols)) for (const [i, c] of (s.code || []).entries()) {
    if (!/^sql$/i.test(c.lang) || c.dialect !== 'portable' || !c.expect) continue;
    n++;
    let rs;
    try { rs = await runBlock(pool, c.src.join('\n')); } catch (e) { ok(false, `${id}#${i} "${c.title}": SQL Server error: ${e.message}`); continue; }
    const got = rs.map(r => c.expect.cols.map(col => r[col] === undefined ? `<missing column ${col}>` : r[col]));
    if (!ok(got.length === c.expect.rows.length, `${id}#${i} "${c.title}": ${got.length} row(s), expected ${c.expect.rows.length}`)) continue;
    const diffs = [];
    c.expect.rows.forEach((row, ri) => row.forEach((v, ci) => { if (!same(got[ri][ci], v)) diffs.push(`row ${ri + 1} ${c.expect.cols[ci]}: expected ${v}, got ${got[ri][ci]}`); }));
    ok(!diffs.length, `${id}#${i} "${c.title}": same result as SQLite${diffs.length ? ' — ' + diffs.slice(0, 3).join('; ') : ''}`);
  }

  /* T-SQL: MERGE loads the same rows as the portable idempotent load, and is idempotent itself */
  try {
    const want = expectOf('sql-load-2', 0).rows[0][0];
    await pool.request().batch('DROP TABLE IF EXISTS dbo.fact_sales; CREATE TABLE dbo.fact_sales (OrderID NVARCHAR(20), [LineNo] INT, ProductKey INT, Qty INT, UnitPrice DECIMAL(12,2), DiscountPct INT)');
    await pool.request().batch('IF OBJECT_ID(\'dbo.FactSales\', \'SN\') IS NULL CREATE SYNONYM dbo.FactSales FOR dbo.fact_sales');
    const merge = sols['sql-load-2'].code[1].src.join('\n');
    await runBlock(pool, merge);
    const once = (await pool.request().query('SELECT COUNT(*) AS n FROM dbo.FactSales')).recordset[0].n;
    await runBlock(pool, merge);
    const twice = (await pool.request().query('SELECT COUNT(*) AS n FROM dbo.FactSales')).recordset[0].n;
    ok(same(once, want) && same(twice, want), `sql-load-2#1 MERGE: ${once} rows after one run, ${twice} after two (expected ${want} both times)`);
  } catch (e) { ok(false, `sql-load-2#1 MERGE: SQL Server error: ${e.message}`); }

  /* T-SQL: the rewrite returns the rows its portable equivalent counts, and the index DDL runs */
  try {
    const want = expectOf('sql-tune-0', 0); const wi = want.cols.indexOf('RewriteRows');
    const st = split(sols['sql-tune-0'].code[1].src.join('\n'));
    const rows = (await pool.request().batch(st[0] + ';')).recordset.length;
    ok(same(rows, want.rows[0][wi]), `sql-tune-0#1 rewrite: ${rows} rows (portable version: ${want.rows[0][wi]})`);
    for (const s of st.slice(1)) await pool.request().batch(s);
    ok(true, `sql-tune-0#1 index DDL: ${st.length - 1} statement(s) ran`);
  } catch (e) { ok(false, `sql-tune-0#1 rewrite: SQL Server error: ${e.message}`); }

  await pool.close();
  console.log(results.join('\n'));
  const failed = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n${failed ? 'FAILED' : 'OK'}: ${results.length - failed} passed, ${failed} failed (${n} portable blocks run)`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
