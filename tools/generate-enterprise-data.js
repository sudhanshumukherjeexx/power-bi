/* Enterprise scale pack: generates a large, realistic Northwind sales dataset on your machine.
   Streams to disk, so 50 million rows need little memory. Same seed and size → identical files.

   Usage (from the project root):
     node tools/generate-enterprise-data.js --rows 1000000 [--out enterprise-data] [--seed 42]
     node tools/generate-enterprise-data.js --scale 10m

   Output (CSV, UTF-8):
     fact_sales.csv        one row per order line: SalesKey, OrderID, OrderTimestamp, OrderDate, LoadDate,
                           CustomerKey, ProductKey, Channel, Currency, Qty, UnitPrice, DiscountPct, NetAmount (USD)
     dim_customer.csv      current customer attributes (skewed: a few customers buy a lot)
     customer_history.csv  SCD type 2 source: attribute changes with EffectiveDate
     dim_product.csv, dim_date.csv, fx_rates.csv
     manifest.json         row counts and the exact number of each injected defect

   Injected defects (counts in tools/enterprise.config.json, per million rows): exact duplicate rows, null Qty,
   CustomerKeys that don't exist in dim_customer, late-arriving rows (LoadDate well after OrderDate) and a few
   future-dated orders. Nothing in the file names tells you which rows are defective. */
'use strict';
const fs = require('fs'), path = require('path');
const DS = require('./lib/course-data');

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pad = n => String(n).padStart(2, '0');
const isoDate = t => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const isoTime = t => { const d = new Date(t); return `${isoDate(t)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
const DAY = 86400000;
const pickW = (r, entries) => { let u = r(); for (const [k, w] of entries) { if ((u -= w) < 0) return k; } return entries[entries.length - 1][0]; };

function args(argv) {
  const a = {}; for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) a[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  return a;
}

/* plan exactly which row numbers get which defect, so counts are exact and reproducible */
function defectPlan(cfg, rows, r) {
  const want = {}; for (const [k, perM] of Object.entries(cfg.defectsPerMillion)) want[k] = Math.round(perM * rows / 1e6);
  const taken = new Set(); const plan = {};
  for (const [k, n] of Object.entries(want)) {
    plan[k] = new Set();
    while (plan[k].size < n) { const i = 1 + Math.floor(r() * (rows - 1)); if (!taken.has(i)) { taken.add(i); plan[k].add(i); } }
  }
  return { want, plan };
}

async function generate(opts = {}) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'enterprise.config.json'), 'utf8'));
  const rows = +opts.rows || cfg.scales[opts.scale] || 100000;
  const seed = +(opts.seed || cfg.seed);
  const out = opts.out || 'enterprise-data';
  fs.mkdirSync(out, { recursive: true });
  const r = rng(seed);
  const products = DS.DimProduct.rows.map(p => ({ key: p[0], name: p[1], cat: p[2], cost: p[5], price: p[6] }));
  const nCust = Math.max(100, Math.round(cfg.customersPerMillionRows * rows / 1e6));
  const start = Date.parse(cfg.start + 'T00:00:00Z'), end = Date.parse(cfg.end + 'T00:00:00Z');
  const days = Math.round((end - start) / DAY) + 1;
  const write = (name) => fs.createWriteStream(path.join(out, name), { encoding: 'utf8' });
  const put = (ws, line) => new Promise(res => ws.write(line + '\n') ? res() : ws.once('drain', res));
  const close = ws => new Promise(res => ws.end(res));

  /* dimensions */
  const segs = ['Consumer', 'Small Business', 'Outfitter'];
  let w = write('dim_customer.csv');
  await put(w, 'CustomerKey,CustomerID,Segment,HomeRegionKey,LoyaltyTier,JoinDate');
  const custSeg = [];
  for (let i = 1; i <= nCust; i++) {
    const seg = pickW(r, [['Consumer', 0.75], ['Small Business', 0.18], ['Outfitter', 0.07]]); custSeg[i] = seg;
    await put(w, [i, 'C' + (100000 + i), seg, 1 + Math.floor(r() * 5), ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(r() * r() * 4)], isoDate(start - Math.floor(r() * 2000) * DAY)].join(','));
  }
  await close(w);
  w = write('customer_history.csv');
  await put(w, 'CustomerID,EffectiveDate,Segment,LoyaltyTier');
  const nChanges = Math.round(cfg.scdChangesPerThousandCustomers * nCust / 1000);
  for (let i = 0; i < nChanges; i++) {
    const c = 1 + Math.floor(r() * nCust);
    await put(w, ['C' + (100000 + c), isoDate(start + Math.floor(r() * days) * DAY), segs[Math.floor(r() * 3)], ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(r() * 4)]].join(','));
  }
  await close(w);
  w = write('dim_product.csv');
  await put(w, 'ProductKey,ProductName,Category,UnitCostUSD,ListPriceUSD');
  for (const p of products) await put(w, [p.key, `"${p.name}"`, p.cat, p.cost, p.price].join(','));
  await close(w);
  w = write('dim_date.csv');
  await put(w, 'Date,Year,MonthNumber,MonthName,Quarter,DayOfWeek,IsWeekend');
  for (let d = 0; d < days + 400; d++) { const t = start + d * DAY, x = new Date(t); await put(w, [isoDate(t), x.getUTCFullYear(), x.getUTCMonth() + 1, x.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), 'Q' + (Math.floor(x.getUTCMonth() / 3) + 1), x.getUTCDay() || 7, x.getUTCDay() === 0 || x.getUTCDay() === 6].join(',')); }
  await close(w);
  const fx = {}; let eur = 1.08, gbp = 1.27;
  w = write('fx_rates.csv'); await put(w, 'Month,Currency,USDPerUnit');
  for (let t = start; t <= end + 31 * DAY; t += 28 * DAY) {
    const m = isoDate(t).slice(0, 7); if (fx[m]) continue;
    eur *= 1 + (r() - 0.5) * 0.02; gbp *= 1 + (r() - 0.5) * 0.02;
    fx[m] = { USD: 1, EUR: +eur.toFixed(4), GBP: +gbp.toFixed(4) };
    await put(w, `${m},EUR,${fx[m].EUR}`); await put(w, `${m},GBP,${fx[m].GBP}`);
  }
  await close(w);

  /* fact: skewed customers via a power law, seasonality, defects at planned row numbers */
  const { want, plan } = defectPlan(cfg, rows, rng(seed + 1));
  const chan = Object.entries(cfg.channels), cur = Object.entries(cfg.currencies);
  w = write('fact_sales.csv');
  await put(w, 'SalesKey,OrderID,OrderTimestamp,OrderDate,LoadDate,CustomerKey,ProductKey,Channel,Currency,Qty,UnitPrice,DiscountPct,NetAmount');
  let order = 1, linesLeft = 0, o = null, prev = null, written = 0;
  for (let i = 1; i <= rows; i++) {
    if (plan.duplicate_rows.has(i) && prev) { await put(w, prev); written++; continue; }
    if (linesLeft <= 0) {
      const dayIdx = Math.floor(Math.pow(r(), 0.85) * days);           /* more recent days slightly busier */
      const t = start + (days - 1 - dayIdx) * DAY + Math.floor(r() * DAY);
      o = { id: 'SO' + (10000000 + order++), t, cust: 1 + Math.floor(Math.pow(r(), cfg.customerSkew * 2) * nCust), ch: pickW(r, chan), cu: pickW(r, cur) };
      linesLeft = 1 + Math.floor(r() * (o.ch === 'Wholesale' ? 6 : 3));
    }
    linesLeft--;
    const p = products[Math.floor(r() * products.length)];
    let t = o.t, cust = o.cust, qty = o.ch === 'Wholesale' ? 2 + Math.floor(r() * 20) : 1 + Math.floor(r() * 3);
    if (plan.future_dated.has(i)) t = end + (30 + Math.floor(r() * 300)) * DAY;
    if (plan.invalid_customer_keys.has(i)) cust = nCust + 1 + Math.floor(r() * 1000);
    const load = plan.late_arrivals.has(i) ? t + (8 + Math.floor(r() * 60)) * DAY : t + Math.floor(r() * 2) * DAY;
    const disc = o.ch === 'Staff' ? 30 : o.ch === 'Wholesale' ? 20 : [0, 0, 0, 5, 10, 15][Math.floor(r() * 6)];
    const rate = fx[isoDate(t).slice(0, 7)] ? fx[isoDate(t).slice(0, 7)][o.cu] : 1;
    const price = +(p.price / (o.cu === 'USD' ? 1 : rate)).toFixed(2);
    const net = (qty * price * (100 - disc) / 100 * rate).toFixed(2);
    const line = [i, o.id, isoTime(t), isoDate(t), isoDate(load), cust, p.key, o.ch, o.cu, plan.null_qty.has(i) ? '' : qty, price, disc, net].join(',');
    await put(w, line); prev = line; written++;
  }
  await close(w);
  const manifest = { seed, rows: written, customers: nCust, products: products.length, scdChanges: nChanges, defects: want, generated: 'tools/generate-enterprise-data.js' };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (require.main === module) {
  const a = args(process.argv.slice(2));
  const t0 = Date.now();
  generate(a).then(m => console.log(`${m.rows.toLocaleString('en-US')} fact rows, ${m.customers.toLocaleString('en-US')} customers in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${a.out || 'enterprise-data'}/\ndefects: ${JSON.stringify(m.defects)}`))
    .catch(e => { console.error(e); process.exit(1); });
}
module.exports = { generate };
