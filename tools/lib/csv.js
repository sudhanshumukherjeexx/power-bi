/* Minimal RFC 4180 CSV reader/writer used by the build, the generators and the tests. */
'use strict';

function parse(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const cell = v => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const stringify = (cols, rows) => [cols.join(','), ...rows.map(r => r.map(cell).join(','))].join('\n') + '\n';

/* read a CSV file into {cols, rows} (all values are strings, exactly as written) */
function read(file) {
  const all = parse(require('fs').readFileSync(file, 'utf8'));
  return { cols: all[0], rows: all.slice(1) };
}
/* read into objects keyed by column name */
function objects(file) { const { cols, rows } = read(file); return rows.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))); }

module.exports = { parse, stringify, read, objects, cell };
