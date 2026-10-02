/* Professional templates: content/templates/<id>.md (with {{fact}} placeholders filled) →
   assets/js/templates.js for templates.html, and templates/<id>.md as downloadable files. */
'use strict';
const fs = require('fs'), path = require('path');
module.exports = (all, { BANNER, J }) => {
  const out = {};
  const { fill } = require('./company-facts');
  const list = (all.templates || []).map(t => {
    const src = path.join(all.root, 'content', 'templates', t.id + '.md');
    if (!fs.existsSync(src)) throw new Error(`content/templates/index.json lists "${t.id}" but ${t.id}.md is missing`);
    const md = fill(fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n'), `content/templates/${t.id}.md`);
    out[`templates/${t.id}.md`] = md;
    return Object.assign({}, t, { md });
  });
  out['assets/js/templates.js'] = BANNER('content/templates') + `const TEMPLATES=[\n${list.map(J).join(',\n')}\n];\n`;
  return out;
};
