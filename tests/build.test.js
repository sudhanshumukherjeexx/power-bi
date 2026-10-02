/* Generated files are current, every JavaScript file compiles, and every inline script compiles. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { root, walk, rel } = require('./lib/util');

module.exports = t => {
  let out;
  try { out = require('../tools/build').outputs(); t.ok(true); }
  catch (e) { t.ok(false, 'tools/build.js failed: ' + e.message); return; }
  for (const [r, text] of Object.entries(out)) {
    const f = path.join(root, r);
    t.ok(fs.existsSync(f) && fs.readFileSync(f, 'utf8') === text, `${r} is out of date. Run: node tools/build.js`);
  }

  const compile = (src, name) => { try { new vm.Script(src, { filename: name }); return true; } catch (e) { t.ok(false, `${name}: ${e.message}`); return false; } };
  const js = walk(root, p => p.endsWith('.js') && !/[\\/](node_modules|\.git)[\\/]/.test(p));
  for (const f of js) {
    const src = fs.readFileSync(f, 'utf8');
    /* CommonJS tools are wrapped like Node does, so top-level return/require are legal */
    t.ok(compile(/^(tools|tests)\//.test(rel(f)) ? `(function(exports,require,module,__filename,__dirname){${src}\n})` : src, rel(f)), '');
  }
  const html = walk(root, p => p.endsWith('.html') && !/[\\/](node_modules|starter)[\\/]/.test(p));
  for (const f of html) {
    const src = fs.readFileSync(f, 'utf8');
    const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m, n = 0;
    while ((m = re.exec(src))) { n++; t.ok(compile(m[1], `${rel(f)} inline script ${n}`), ''); }
  }
};
