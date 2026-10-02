/* Runs every check in tests/*.test.js. Exit code 1 if any check fails; warnings never fail the run.
   Usage (from the project root):  node tests/run.js [name-filter] [--verbose] */
'use strict';
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const filter = args.find(a => !a.startsWith('--'));
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && (!filter || f.includes(filter))).sort();

(async () => {
  let failed = 0, passed = 0, warned = 0;
  for (const f of files) {
    const t = { fails: [], warns: [], passes: 0,
      ok(cond, msg) { if (cond) this.passes++; else this.fails.push(msg); return !!cond; },
      eq(actual, expected, msg) { return this.ok(actual === expected, `${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
      warn(msg) { this.warns.push(msg); } };
    const started = Date.now();
    try { await require(path.join(__dirname, f))(t); }
    catch (e) { t.fails.push('crashed: ' + (e.stack || e.message)); }
    const ms = Date.now() - started;
    const status = t.fails.length ? 'FAIL' : 'pass';
    console.log(`${status}  ${f.replace('.test.js', '').padEnd(14)} ${String(t.passes).padStart(5)} checks${t.warns.length ? `, ${t.warns.length} warning(s)` : ''}  ${ms} ms`);
    for (const m of t.fails) console.log('      ✗ ' + m);
    for (const m of (verbose ? t.warns : t.warns.slice(0, 8))) console.log('      ! ' + m);
    if (!verbose && t.warns.length > 8) console.log(`      ! … ${t.warns.length - 8} more (use --verbose)`);
    failed += t.fails.length; passed += t.passes; warned += t.warns.length;
  }
  console.log(`\n${failed ? 'FAILED' : 'OK'}: ${passed} checks passed, ${failed} failed, ${warned} warning(s)`);
  process.exit(failed ? 1 : 0);
})();
