/* Local preview that behaves like GitHub Pages for this project site: serves site/ under /power-bi/, redirects / to
   /power-bi/, returns 404.html for missing files, and sends no-store so you always see the latest build.
   Usage: node tools/serve.js [port]   (default 4173). Used by the browser tests (playwright.config.js). */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'site'), port = +(process.argv[2] || process.env.PORT || 4173), BASE = '/power-bi/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.csv': 'text/csv; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.zip': 'application/zip', '.yml': 'text/yaml; charset=utf-8', '.py': 'text/plain; charset=utf-8', '.sql': 'text/plain; charset=utf-8', '.tmdl': 'text/plain; charset=utf-8', '.log': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let u;
  try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (!u.startsWith(BASE)) { res.writeHead(302, { Location: BASE }); return res.end(); }
  let f = path.join(dir, u.slice(BASE.length));
  if (!f.startsWith(dir)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(dir, '404.html'))); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`serving site/ at http://localhost:${port}${BASE}`));
