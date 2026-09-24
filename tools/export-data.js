/* Regenerates data/*.csv from assets/js/content.js so the files always match the website.
   Usage (from the project root):  node tools/export-data.js */
const fs = require('fs'), path = require('path'), vm = require('vm');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'assets/js/content.js'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + ';globalThis.__o = {DS, toCSV};', ctx);
const { DS, toCSV } = ctx.__o;

const dir = path.join(root, 'data');
fs.mkdirSync(dir, { recursive: true });
for (const [key, ds] of Object.entries(DS)) {
  fs.writeFileSync(path.join(dir, key + '.csv'), toCSV(ds) + '\n');
  console.log(`${key}.csv  ${ds.rows.length} rows x ${ds.cols.length} cols`);
}
