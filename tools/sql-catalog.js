/* Every SQL example in the project, with its dialect and how it is validated (docs/sql-validation.md).
     worked solutions   content/solutions/*.json   code[] blocks with lang "SQL" and a "dialect"
     Toolkit guides     content/toolkit/guides/*.md ```sql <dialect> fences
     data files         every .sql file under site/data (T-SQL evidence files)
   Dialects: portable (must run on SQLite and SQL Server), sqlite, tsql.
   Validation levels:
     executed     run against the generated data in SQLite by tests/sql.test.js, result compared with the expected rows
     parsed       parsed by SQLFluff in its dialect (CI "sql" job); portable blocks are parsed as T-SQL too
     sql-server   run against SQL Server 2022 in a container (.github/workflows/sql-server.yml, tools/sqlserver-check.js)
   Usage:
     node tools/sql-catalog.js                 print the matrix
     node tools/sql-catalog.js --extract DIR   write one .sql file per (block, dialect to parse) under DIR/<dialect>/
     node tools/sql-catalog.js --doc           regenerate the table in docs/sql-validation.md */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('./lib/load');
const root = path.join(__dirname, '..');
const DIALECTS = ['portable', 'sqlite', 'tsql'];
/* T-SQL blocks that the SQL Server check runs (ids from tools/sqlserver-check.js) */
const SQL_SERVER = new Set(['sql-load-2', 'sql-tune-0']);

function catalog() {
  const all = load.all(), out = [];
  for (const [id, s] of Object.entries(all.solutions)) (s.code || []).forEach((b, i) => {
    if (!/^sql$/i.test(b.lang || '')) return;
    const src = Array.isArray(b.src) ? b.src.join('\n') : b.src;
    out.push({ id: `${id}#${i}`, key: id, where: `content/solutions (${id})`, title: b.title, dialect: b.dialect || null, src, executed: !!b.expect && b.dialect !== 'tsql' });
  });
  const gdir = path.join(root, 'content/toolkit/guides');
  for (const f of fs.readdirSync(gdir).filter(x => x.endsWith('.md'))) {
    const L = fs.readFileSync(path.join(gdir, f), 'utf8').split('\n'); let n = 0;
    for (let i = 0; i < L.length; i++) {
      const m = L[i].match(/^```sql\b\s*(\S*)/); if (!m) continue;
      const buf = []; i++; while (i < L.length && !/^```\s*$/.test(L[i])) buf.push(L[i++]);
      n++; out.push({ id: `${f.replace(/\.md$/, '')}#${n}`, key: f, where: `content/toolkit/guides/${f}`, title: (buf.find(l => /^--/.test(l)) || '').replace(/^--\s*/, '') || `block ${n}`, dialect: m[1] || null, src: buf.join('\n'), executed: false });
    }
  }
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.sql') ? [path.join(d, e.name)] : []);
  for (const f of walk(path.join(root, 'site/data'))) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    out.push({ id: rel, key: rel, where: rel, title: 'evidence file', dialect: 'tsql', src: fs.readFileSync(f, 'utf8'), executed: false });
  }
  for (const b of out) {
    b.parseAs = b.dialect === 'portable' ? ['sqlite', 'tsql'] : b.dialect ? [b.dialect] : [];
    /* tools/sqlserver-check.js runs every executed portable block, plus the named T-SQL blocks */
    b.sqlServer = (b.dialect === 'portable' && b.executed) || (b.dialect === 'tsql' && SQL_SERVER.has(b.key));
    b.levels = [b.executed && 'executed', b.parseAs.length && 'parsed', b.sqlServer && 'sql-server'].filter(Boolean);
  }
  return out;
}

if (require.main === module) {
  const blocks = catalog(), arg = process.argv[2];
  const bad = blocks.filter(b => !DIALECTS.includes(b.dialect));
  if (bad.length) { console.error('SQL blocks without a known dialect (portable, sqlite, tsql):\n' + bad.map(b => `  ${b.where}: ${b.title}`).join('\n')); process.exit(1); }
  if (arg === '--extract') {
    const dir = path.resolve(process.argv[3] || '.sql-lint');
    fs.rmSync(dir, { recursive: true, force: true });
    let n = 0;
    for (const b of blocks) for (const d of b.parseAs) {
      const f = path.join(dir, d, b.id.replace(/[^A-Za-z0-9_.-]+/g, '_') + '.sql');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      /* SQLFluff parses a statement list; documentation-only comments and Power BI parameters are kept as written */
      fs.writeFileSync(f, b.src.trim().replace(/;?\s*$/, ';') + '\n'); n++;
    }
    console.log(`wrote ${n} files for ${blocks.length} SQL blocks to ${path.relative(process.cwd(), dir)}`);
  } else if (arg === '--doc') {
    const f = path.join(root, 'docs/sql-validation.md');
    const table = `| SQL block | Where | Dialect | Validated by |\n|---|---|---|---|\n` +
      blocks.map(b => `| ${b.title.replace(/\|/g, '\\|')} | \`${b.where}\` | ${b.dialect} | ${b.levels.join(', ')} |`).join('\n');
    const doc = fs.readFileSync(f, 'utf8').replace(/<!-- matrix -->[\s\S]*<!-- \/matrix -->/, `<!-- matrix -->\n${table}\n<!-- /matrix -->`);
    fs.writeFileSync(f, doc); console.log('updated docs/sql-validation.md');
  } else {
    const count = k => blocks.filter(b => b.levels.includes(k)).length;
    console.log(`${blocks.length} SQL blocks: ${count('executed')} executed, ${count('parsed')} parsed, ${count('sql-server')} run on SQL Server`);
    for (const b of blocks) console.log(`  ${b.dialect.padEnd(8)} ${b.levels.join('+').padEnd(26)} ${b.where}: ${b.title}`);
  }
}
module.exports = { catalog, DIALECTS };
