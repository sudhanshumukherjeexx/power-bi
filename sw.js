/* Offline support. Pages and data: network first (so updates show up), cache as fallback.
   Google Fonts: cache first. Bump VERSION when you want every visitor to drop the old cache. */
const VERSION = 'pbi-holy-grail-v2';
const CORE = [
  './',
  'index.html',
  'flashcards.html',
  'glossary.html',
  'cheatsheet.html',
  'beginner.html',
  'intermediate.html',
  'advanced.html',
  'resources.html',
  '404.html',
  'manifest.webmanifest',
  'assets/css/site.css',
  'assets/js/content.js',
  'assets/js/cards.js',
  'assets/js/glossary.js',
  'assets/js/solutions.js',
  'assets/js/paths.js',
  'assets/js/site.js',
  'assets/js/course.js',
  'assets/js/levelpage.js',
  'assets/css/pages.css',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'data/CustomerTargets.csv',
  'data/DimCustomer.csv',
  'data/DimDate.csv',
  'data/DimEmployee.csv',
  'data/DimProduct.csv',
  'data/DimRegion.csv',
  'data/ExchangeRates.csv',
  'data/FactBudget.csv',
  'data/FactInventory.csv',
  'data/FactSales.csv',
  'data/RawOrdersExport.csv',
  'data/SurveyWide.csv',
  'data/UserRegionMapping.csv',
  'data/WebEvents.csv',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const network = fetch(req).then(res => {
      if (res.ok && !url.pathname.endsWith(".zip")) cache.put(req, res.clone());
      return res;
    });
    // wait up to 4 s for the network, then fall back to the cache
    const first = await Promise.race([network.catch(() => null), new Promise(r => setTimeout(r, 4000, null))]);
    if (first) return first;
    const hit = (await cache.match(req, { ignoreSearch: true })) ||
      (req.mode === "navigate" ? await cache.match("index.html") : undefined);
    if (hit) return hit;
    try { return await network; } catch (err) { return Response.error(); }
  })());
});
