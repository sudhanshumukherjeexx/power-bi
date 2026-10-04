/* Every SQL example declares a dialect, and docs/sql-validation.md lists them all with how each is validated
   (tools/sql-catalog.js). Portable blocks with expected rows are executed (tests/sql.test.js). */
'use strict';
const fs = require('fs'), path = require('path');
const { catalog, DIALECTS } = require('../tools/sql-catalog');
const { root } = require('./lib/util');

module.exports = t => {
  const blocks = catalog();
  t.ok(blocks.length >= 30, `SQL catalog found ${blocks.length} blocks`);
  for (const b of blocks) {
    t.ok(DIALECTS.includes(b.dialect), `${b.where} "${b.title}": dialect must be one of ${DIALECTS.join(', ')} (got ${b.dialect})`);
    if (b.dialect === 'portable') t.ok(!/\bLineNo\b(?!["\]])/.test(b.src.replace(/"LineNo"/g, '').replace(/--.*$/gm, '')), `${b.where} "${b.title}": LineNo is reserved in T-SQL; write "LineNo"`);
    if (b.dialect === 'tsql') t.ok(!/(?<![\["])\bLineNo\b(?![\]"])/.test(b.src.replace(/--.*$/gm, '')), `${b.where} "${b.title}": LineNo is reserved in T-SQL; write [LineNo]`);
    if (b.dialect === 'portable') t.ok(!/CREATE\s+TABLE\s+\w+\s+AS\b/i.test(b.src), `${b.where} "${b.title}": CREATE TABLE ... AS isn't SQL Server syntax`);
    t.ok(b.levels.length > 0, `${b.where} "${b.title}": not validated by anything`);
  }
  const doc = fs.readFileSync(path.join(root, 'docs/sql-validation.md'), 'utf8');
  const listed = (doc.match(/<!-- matrix -->([\s\S]*)<!-- \/matrix -->/) || [])[1] || '';
  for (const b of blocks) t.ok(listed.includes(`\`${b.where}\``) && listed.includes(b.title.replace(/\|/g, '\\|')), `docs/sql-validation.md doesn't list "${b.title}" (${b.where}); run node tools/sql-catalog.js --doc`);
  t.eq((listed.match(/^\| (?!SQL block|---)/gm) || []).length, blocks.length, 'docs/sql-validation.md lists every SQL block exactly once');
};
