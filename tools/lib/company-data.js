/* Northwind Outdoors company pack for Experience Mode (data/experience/company/*.csv).
   Deterministic: a fixed seed and integer-cent arithmetic, so every learner and every CI run sees
   identical files. 15 months of orders (Jan 2025 – Mar 2026, extracted on 10 Apr 2026) with the
   defects and business events the scenarios are built on. Nothing about the defects is in a file name.

   Planted events (the scenarios never state these; the solutions do, with numbers computed from here):
   - Summit Outfitters Co. (C10077), the largest wholesale customer, places its last order on 2026-02-09.
   - Drift Paddle Board (product 20) has a quality problem from Jan 2026: about 30% of units come back.
   - Marketplace channel launches on 2025-07-01. Staff purchases (channel Staff) are not revenue for Finance.
   - Orders placed after 18:00 on the last day of a month post to the ledger the next day.
   - 37 order lines in March 2026 were exported twice (exact duplicates).
   - A test customer ("TEST ACCOUNT - DO NOT USE") has real-looking orders.
   - About 3% of orders are Cancelled but still in the export.
   - Europe (region 5) sells in EUR; everything else in USD. */
'use strict';
const csv = require('./csv');
const DS = require('./course-data');

function rng(seed) { let s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pad = (n, w = 2) => String(n).padStart(w, '0');
const iso = t => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const DAY = 86400000;
const T = s => Date.parse(s + 'T00:00:00Z');
const money = c => (c / 100).toFixed(2);                      /* cents → "123.45" */
const pickW = (r, items) => { const tot = items.reduce((a, x) => a + x[1], 0); let u = r() * tot; for (const [v, w] of items) { if ((u -= w) < 0) return v; } return items[items.length - 1][0]; };

const START = T('2025-01-01'), END = T('2026-03-31'), EXTRACT = T('2026-04-10');

function build() {
  const r = rng(20260410);
  /* ---------- regions ---------- */
  const regions = [
    [1, 'West', 'USA', 'USD', 'Dana Whitfield'], [2, 'South', 'USA', 'USD', 'Marcus Bell'], [3, 'East', 'USA', 'USD', 'Priya Raman'],
    [4, 'Central', 'USA', 'USD', 'Tomas Ekberg'], [5, 'Europe', 'Germany', 'EUR', 'Lea Brandt']];
  /* ---------- products: the 24 course products ---------- */
  const products = DS.DimProduct.rows.map(p => ({ key: p[0], name: p[1], cat: p[2], sub: p[3], brand: p[4], cost: Math.round(p[5] * 100), list: Math.round(p[6] * 100) }));
  /* ---------- customers ---------- */
  const first = ['Ava', 'Liam', 'Noah', 'Emma', 'Mia', 'Ethan', 'Olivia', 'Lucas', 'Zoe', 'Mason', 'Isla', 'Leo', 'Nora', 'Aiden', 'Ruby', 'Owen', 'Chloe', 'Eli', 'Hana', 'Jack', 'Maya', 'Finn', 'Lena', 'Kai', 'Sara', 'Theo', 'Ivy', 'Max', 'Nia', 'Cole', 'Jonas', 'Elif', 'Mateo', 'Ines', 'Arjun', 'Yuki'];
  const last = ['Patel', 'Nguyen', 'Garcia', 'Okafor', 'Schmidt', 'Rossi', 'Kim', 'Silva', 'Brown', 'Haddad', 'Larsen', 'Meyer', 'Ortiz', 'Singh', 'Tanaka', 'Walsh', 'Novak', 'Reyes', 'Dube', 'Fischer', 'Costa', 'Ali', 'Moore', 'Byrne', 'Chen', 'Adler', 'Lund', 'Rana', 'Hughes', 'Bakr', 'Weber', 'Kowal'];
  const bizA = ['Trailhead', 'Peak', 'Cedar', 'Riverbend', 'Granite', 'Pinecrest', 'Bluewater', 'Canyon', 'Ridgeway', 'Northstar', 'Basecamp', 'Timberline', 'Lakeside', 'Highland', 'Wildflower', 'Ironwood'];
  const bizB = ['Outfitters', 'Adventure Co.', 'Sports', 'Gear Shop', 'Expeditions', 'Supply', 'Outdoor Store', 'Mountain Goods'];
  const customers = [];
  for (let i = 0; i < 420; i++) {
    const id = 'C' + (10001 + i);
    const seg = pickW(r, [['Consumer', 70], ['Small Business', 20], ['Outfitter', 10]]);
    const region = pickW(r, [[1, 30], [2, 20], [3, 25], [4, 15], [5, 10]]);
    const name = seg === 'Consumer' ? `${first[Math.floor(r() * first.length)]} ${last[Math.floor(r() * last.length)]}` : `${bizA[Math.floor(r() * bizA.length)]} ${bizB[Math.floor(r() * bizB.length)]}`;
    const join = iso(T('2019-01-01') + Math.floor(r() * (T('2026-03-01') - T('2019-01-01')) / DAY) * DAY);
    customers.push({ id, name, seg, region, join, weight: seg === 'Consumer' ? 1 : seg === 'Small Business' ? 2.2 : 3 });
  }
  /* named accounts */
  const summit = customers[76]; Object.assign(summit, { name: 'Summit Outfitters Co.', seg: 'Outfitter', region: 4, join: '2018-06-11', weight: 14 });
  customers.push({ id: 'C19999', name: 'TEST ACCOUNT - DO NOT USE', seg: 'Consumer', region: 1, join: '2025-05-02', weight: 0, test: true });
  /* Pareto: a few customers buy a lot */
  customers.forEach((c, i) => { if (!c.test && c !== summit && r() < 0.06) c.weight *= 4; });
  const custByRegion = {};
  customers.filter(c => !c.test).forEach(c => (custByRegion[c.region] = custByRegion[c.region] || []).push(c));
  const pickCust = (rr, pool) => { const tot = pool.reduce((a, c) => a + c.weight, 0); let u = rr() * tot; for (const c of pool) if ((u -= c.weight) < 0) return c; return pool[pool.length - 1]; };

  /* ---------- FX: monthly average USD per EUR ---------- */
  const fx = []; let eur = 1.085;
  for (let t = START; t <= T('2026-04-01'); ) { const d = new Date(t); fx.push({ month: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`, rate: Math.round(eur * 10000) / 10000 }); eur = eur * (1 + (r() - 0.48) * 0.018); t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); }
  const fxOf = m => fx.find(x => x.month === m).rate;

  /* ---------- orders, lines, returns ---------- */
  const orders = [], lines = [], returns = [];
  let on = 500000, rn = 900000;
  const catW = m => [['Camping', m >= 5 && m <= 8 ? 30 : 22], ['Hiking', 26], ['Apparel', m >= 10 || m <= 2 ? 30 : 22], ['Water', m >= 5 && m <= 8 ? 30 : 16]];
  for (let t = START; t <= END; t += DAY) {
    const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dow = d.getUTCDay();
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate() === d.getUTCDate();
    /* volume: seasonality, weekend bump, and growth into 2026 */
    const season = [0, 0.8, 0.78, 0.9, 1.0, 1.15, 1.3, 1.32, 1.2, 1.0, 0.95, 1.1, 1.35][m];
    const growth = y === 2026 ? 1.04 : 1;
    const n = Math.max(2, Math.round(7.5 * season * growth * (dow === 0 || dow === 6 ? 1.25 : 1) + (r() - 0.5) * 4));
    for (let k = 0; k < n; k++) {
      let channel = pickW(r, [['Online', 50], ['Store', 34], ['Wholesale', 6], ['Marketplace', t >= T('2025-07-01') ? 9 : 0], ['Staff', 1.6]]);
      let cust;
      if (channel === 'Wholesale') {
        const pool = customers.filter(c => !c.test && c.seg !== 'Consumer' && !(c === summit && t > T('2026-02-09')));
        cust = r() < 0.3 && !(t > T('2026-02-09')) ? summit : pickCust(r, pool);
      } else {
        const region = pickW(r, [[1, 30], [2, 20], [3, 25], [4, 15], [5, 10]]);
        cust = pickCust(r, custByRegion[region].filter(c => c !== summit));
      }
      /* sales region: usually the customer's home region; stores and reps sometimes sell across regions */
      const salesRegion = cust.region === 5 ? 5 : r() < 0.82 ? cust.region : pickW(r, [[1, 30], [2, 20], [3, 25], [4, 15]]);
      const hour = Math.floor(r() * 15) + 8;
      const posting = lastDay && hour >= 18 ? t + DAY : t;
      const status = r() < 0.03 ? 'Cancelled' : 'Completed';
      const currency = salesRegion === 5 ? 'EUR' : 'USD';
      const orderId = 'SO-' + (++on);
      const ship = status === 'Cancelled' ? '' : iso(t + DAY * (1 + Math.floor(r() * (channel === 'Wholesale' ? 7 : 4))));
      orders.push({ OrderID: orderId, OrderDate: iso(t), OrderHour: hour, PostingDate: iso(posting), ShipDate: ship, CustomerID: cust.id, Channel: channel, SalesRegionKey: salesRegion, Currency: currency, Status: status });
      const nl = channel === 'Wholesale' ? 2 + Math.floor(r() * 3) : 1 + Math.floor(r() * (r() < 0.6 ? 2 : 4));
      const used = new Set();
      for (let li = 1; li <= nl; li++) {
        const cat = pickW(r, catW(m));
        const opts = products.filter(p => p.cat === cat && !used.has(p.key));
        if (!opts.length) continue;
        const p = opts[Math.floor(r() * opts.length)]; used.add(p.key);
        const qty = channel === 'Wholesale' ? (cust === summit ? 8 + Math.floor(r() * 14) : 3 + Math.floor(r() * 8)) : 1 + Math.floor(r() * (p.list < 5000 ? 3 : 1.4));
        const disc = channel === 'Staff' ? 30 : channel === 'Wholesale' ? pickW(r, [[15, 5], [20, 4], [25, cust === summit ? 6 : 1]]) : pickW(r, [[0, 60], [5, 15], [10, 15], [15, 10]]);
        const price = currency === 'EUR' ? Math.round(p.list * 0.93 / 100) * 100 - 1 : p.list;
        lines.push({ OrderID: orderId, LineNo: li, ProductKey: p.key, Qty: qty, UnitPrice: price, DiscountPct: disc });
        /* returns (only for completed orders): Drift Paddle Board has a quality problem in 2026 */
        if (status === 'Completed') {
          const pr = p.key === 20 && y === 2026 ? 0.42 : channel === 'Wholesale' ? 0.02 : p.cat === 'Apparel' ? 0.08 : 0.045;
          if (r() < pr) {
            const rq = Math.max(1, Math.ceil(qty * (channel === 'Wholesale' ? 0.25 : 1) * (r() < 0.8 ? 1 : 0.5)));
            const rd = t + DAY * (5 + Math.floor(r() * 36));
            if (rd <= EXTRACT) {
              const refund = Math.round(rq * price * (100 - disc) / 100);
              const ship = r() < 0.55 && channel !== 'Wholesale' ? (currency === 'EUR' ? 1395 : 1495) : 0;
              returns.push({ ReturnID: 'RT-' + (++rn), OrderID: orderId, LineNo: li, ReturnDate: iso(rd), Qty: rq, RefundAmount: refund, ShippingRefund: ship, Reason: p.key === 20 && y === 2026 ? pickW(r, [['Defective', 7], ['Damaged in transit', 1], ['Changed mind', 1]]) : pickW(r, [['Changed mind', 5], ['Wrong size', p.cat === 'Apparel' || p.sub === 'Footwear' ? 5 : 0.5], ['Defective', 1.2], ['Damaged in transit', 1]]) });
            }
          }
        }
      }
    }
  }
  /* the test account: a handful of orders that look real */
  const testOrders = [['2025-11-14', 3], ['2026-01-22', 2], ['2026-03-05', 4]];
  for (const [d, n] of testOrders) {
    const orderId = 'SO-' + (++on);
    orders.push({ OrderID: orderId, OrderDate: d, OrderHour: 10, PostingDate: d, ShipDate: iso(T(d) + DAY), CustomerID: 'C19999', Channel: 'Online', SalesRegionKey: 1, Currency: 'USD', Status: 'Completed' });
    lines.push({ OrderID: orderId, LineNo: 1, ProductKey: 19, Qty: n, UnitPrice: products[18].list, DiscountPct: 0 });
  }
  orders.sort((a, b) => a.OrderID < b.OrderID ? -1 : 1);
  /* 37 lines from March 2026 exported twice */
  const byId = new Map(orders.map(o => [o.OrderID, o]));
  const marchLines = lines.filter(l => { const o = byId.get(l.OrderID); return o.OrderDate >= '2026-03-01' && o.CustomerID !== 'C19999'; });
  const dupPick = [];
  const r2 = rng(37);
  while (dupPick.length < 37) { const l = marchLines[Math.floor(r2() * marchLines.length)]; if (!dupPick.includes(l)) dupPick.push(l); }
  const exported = [];
  for (const l of lines) { exported.push(l); if (dupPick.includes(l)) exported.push(Object.assign({}, l)); }

  return { regions, products, customers, orders, lines, exported, returns, fx, fxOf, summit, dupCount: 37, EXTRACT: iso(EXTRACT) };
}

let cache = null;
const company = () => cache || (cache = build());

/* ---------- files ---------- */
function files() {
  const c = company();
  const out = {};
  const put = (name, cols, rows) => out['data/experience/company/' + name] = csv.stringify(cols, rows);
  put('regions.csv', ['RegionKey', 'RegionName', 'Country', 'Currency', 'RegionalManager'], c.regions);
  put('products.csv', ['ProductKey', 'ProductName', 'Category', 'SubCategory', 'Brand', 'UnitCostUSD', 'ListPriceUSD'], c.products.map(p => [p.key, p.name, p.cat, p.sub, p.brand, money(p.cost), money(p.list)]));
  put('customers.csv', ['CustomerID', 'CustomerName', 'Segment', 'HomeRegionKey', 'JoinDate'], c.customers.map(x => [x.id, x.name, x.seg, x.region, x.join]));
  put('orders.csv', ['OrderID', 'OrderDate', 'OrderHour', 'PostingDate', 'ShipDate', 'CustomerID', 'Channel', 'SalesRegionKey', 'Currency', 'Status'], c.orders.map(o => [o.OrderID, o.OrderDate, o.OrderHour, o.PostingDate, o.ShipDate, o.CustomerID, o.Channel, o.SalesRegionKey, o.Currency, o.Status]));
  put('order_lines.csv', ['OrderID', 'LineNo', 'ProductKey', 'Qty', 'UnitPrice', 'DiscountPct'], c.exported.map(l => [l.OrderID, l.LineNo, l.ProductKey, l.Qty, money(l.UnitPrice), l.DiscountPct]));
  put('returns.csv', ['ReturnID', 'OrderID', 'LineNo', 'ReturnDate', 'Qty', 'RefundAmount', 'ShippingRefund', 'Reason'], c.returns.map(x => [x.ReturnID, x.OrderID, x.LineNo, x.ReturnDate, x.Qty, money(x.RefundAmount), money(x.ShippingRefund), x.Reason]));
  put('fx_rates.csv', ['Month', 'Currency', 'USDPerUnit'], c.fx.map(x => [x.month, 'EUR', x.rate.toFixed(4)]));
  for (const extra of [require('./scenario-files')]) Object.assign(out, extra.files(c));
  return out;
}

module.exports = { company, files, money, iso, T, DAY, rng };
