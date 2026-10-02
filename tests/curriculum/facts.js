/* Recomputes, in plain JavaScript, every number the curriculum quotes about the course datasets.
   Each fact mirrors the DAX / M in the worked solution it backs (the solution was also validated in
   Power BI Desktop). tests/curriculum.test.js compares these values with the text of the expected
   results and solution checks, so a dataset change or a typo in the text fails the build. */
'use strict';
const path = require('path');
const csv = require('../../tools/lib/csv');
const root = path.join(__dirname, '..', '..', 'site');

const T = {};
const tbl = name => T[name] || (T[name] = csv.objects(path.join(root, 'data', name + '.csv')));
const num = v => v === '' || v === undefined ? null : +v;
const sum = (rows, f) => rows.reduce((a, r) => a + f(r), 0);
const group = (rows, key) => { const m = new Map(); for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; };
const r2 = x => Math.round(x * 100) / 100;

/* ---------- the core model ---------- */
const sales = () => tbl('FactSales');
const product = k => tbl('DimProduct').find(p => p.ProductKey === k);
const customer = k => tbl('DimCustomer').find(c => c.CustomerKey === k);
const region = k => tbl('DimRegion').find(r => r.RegionKey === k);
const net = r => num(r.Quantity) * num(r.UnitPrice) * (1 - num(r.Discount));
const gross = r => num(r.Quantity) * num(r.UnitPrice);
const cogs = r => num(r.Quantity) * num(product(r.ProductKey).UnitCost);
const month = d => d.slice(0, 7);
const by = (rows, key, f) => Object.fromEntries([...group(rows, key)].map(([k, v]) => [k, f(v)]));

/* ---------- Power Query: RawOrdersExport cleaning (b-pq-0 … b-pq-3) ---------- */
function cleanedOrders() {
  const raw = csv.read(path.join(root, 'data', 'RawOrdersExport.csv'));
  let rows = raw.rows.slice(1, -1);                              // Remove Top Rows(1), Remove Bottom Rows(1)
  const seen = new Set();
  rows = rows.filter(r => { const k = r.join('\u0001'); if (seen.has(k)) return false; seen.add(k); return true; });
  const i = n => raw.cols.indexOf(n);
  return rows.map(r => {
    const qty = r[i('Qty')].trim();
    const price = r[i('Unit Price')].trim();
    return {
      OrderRef: r[i('Order Ref')], Product: r[i('PRODUCT')].trim(),
      Qty: qty === '' || qty === 'N/A' ? null : +qty,
      UnitPrice: price === 'N/A' ? null : +price.replace('$', '').replace(' USD', ''),
      Region: r[i('Region ')].trim().toLowerCase().replace(/^\w/, c => c.toUpperCase())
    };
  });
}
const cleanedColumns = () => csv.read(path.join(root, 'data', 'RawOrdersExport.csv')).cols.filter(c => c !== 'LegacyFlag').length;

/* ---------- employee hierarchy (PATH / PATHCONTAINS) ---------- */
function team(bossName) {
  const emps = tbl('DimEmployee');
  const boss = emps.find(e => e.EmployeeName === bossName);
  const under = new Set([boss.EmployeeKey]);
  let grew = true;
  while (grew) { grew = false; for (const e of emps) if (!under.has(e.EmployeeKey) && under.has(e.ManagerKey)) { under.add(e.EmployeeKey); grew = true; } }
  return under;
}

/* ---------- exchange rates: last Monday rate on or before the date, else the earliest rate ---------- */
function eurRate(date, fallback = true) {
  const rates = tbl('ExchangeRates').filter(r => r.Currency === 'EUR').sort((a, b) => a.RateDate < b.RateDate ? -1 : 1);
  let hit = null; for (const r of rates) if (r.RateDate <= date) hit = r;
  return hit ? num(hit.RateToUSD) : fallback ? num(rates[0].RateToUSD) : null;
}

/* ---------- inventory: last snapshot per month ---------- */
function stockAtMonthEnd(m) {
  const inv = tbl('FactInventory').filter(r => month(r.SnapshotDate) === m);
  const last = inv.map(r => r.SnapshotDate).sort().pop();
  const rows = inv.filter(r => r.SnapshotDate === last);
  return { date: last, qty: sum(rows, r => num(r.QuantityOnHand)), rows };
}
function belowReorder(m) {
  const { rows } = stockAtMonthEnd(m);
  const byP = by(rows, r => r.ProductKey, v => ({ q: sum(v, x => num(x.QuantityOnHand)), rp: Math.max(...v.map(x => num(x.ReorderPoint))) }));
  return Object.entries(byP).filter(([, v]) => v.q < v.rp).map(([k]) => product(k).ProductName);
}

/* ---------- web sessions ---------- */
const sessions = () => group(tbl('WebEvents'), r => r.SessionID);

const F = {
  /* Power Query */
  rawRows: () => csv.read(path.join(root, 'data', 'RawOrdersExport.csv')).rows.length,
  cleanRows: () => cleanedOrders().length,
  cleanCols: () => cleanedColumns() - 0,
  qtyNulls: () => cleanedOrders().filter(r => r.Qty === null).length,
  qtyValid: () => cleanedOrders().filter(r => r.Qty !== null).length,
  qtyValidPct: () => cleanedOrders().filter(r => r.Qty !== null).length / cleanedOrders().length,
  qtyEmptyPct: () => cleanedOrders().filter(r => r.Qty === null).length / cleanedOrders().length,
  qtyDistinct: () => new Set(cleanedOrders().filter(r => r.Qty !== null).map(r => r.Qty)).size,
  qtyUnique: () => { const c = by(cleanedOrders().filter(r => r.Qty !== null), r => r.Qty, v => v.length); return Object.values(c).filter(n => n === 1).length; },
  regions: () => new Set(cleanedOrders().map(r => r.Region)).size,
  productMismatchBeforeFix: () => { const names = new Set(tbl('DimProduct').map(p => p.ProductName)); return cleanedOrders().filter(r => !names.has(r.Product)).length; },
  innerRowsBeforeFix: () => F.cleanRows() - F.productMismatchBeforeFix(),
  productMismatchAfterFix: () => { const names = new Set(tbl('DimProduct').map(p => p.ProductName.toLowerCase())); return cleanedOrders().filter(r => !names.has(r.Product.toLowerCase())).length; },
  surveyLongRows: () => tbl('SurveyWide').length * 3,
  surveyTarget: () => [...new Set(tbl('SurveyWide').map(r => r['Target-2026']))].join(','),
  ratesFound: () => sales().filter(r => eurRate(r.OrderDate, false) !== null).length,
  ordersBeforeFirstRate: () => sales().filter(r => eurRate(r.OrderDate, false) === null).length,

  /* model */
  factRows: () => sales().length,
  dateTableRows: () => (Date.UTC(2027, 0, 1) - Date.UTC(2025, 0, 1)) / 86400000,
  qtyByOrderMonth: m => sum(sales().filter(r => month(r.OrderDate) === m), r => num(r.Quantity)),
  qtyByShipMonth: m => sum(sales().filter(r => month(r.ShipDate) === m), r => num(r.Quantity)),
  qtyBySalesRegion: n => sum(sales().filter(r => region(r.RegionKey).RegionName === n), r => num(r.Quantity)),
  qtyByHomeRegion: n => sum(sales().filter(r => region(customer(r.CustomerKey).RegionKey).RegionName === n), r => num(r.Quantity)),
  totalQty: () => sum(sales(), r => num(r.Quantity)),
  regionMismatchLines: () => sales().filter(r => r.RegionKey !== customer(r.CustomerKey).RegionKey).length,

  /* core measures */
  gross: () => sum(sales(), gross),
  discount: () => sum(sales(), r => gross(r) - net(r)),
  net: () => sum(sales(), net),
  cogs: () => sum(sales(), cogs),
  marginPct: () => (F.net() - F.cogs()) / F.net(),
  orderLines: () => sales().length,
  orders: () => new Set(sales().map(r => r.OrderID)).size,
  customersBuying: () => new Set(sales().map(r => r.CustomerKey)).size,
  aov: () => F.net() / F.orders(),
  ordersByCategory: c => new Set(sales().filter(r => product(r.ProductKey).Category === c).map(r => r.OrderID)).size,
  ordersByCategorySum: () => ['Camping', 'Hiking', 'Apparel', 'Water'].reduce((a, c) => a + F.ordersByCategory(c), 0),
  ordersByChannel: c => new Set(sales().filter(r => r.Channel === c).map(r => r.OrderID)).size,
  ordersByChannelSum: () => [...new Set(sales().map(r => r.Channel))].reduce((a, c) => a + F.ordersByChannel(c), 0),
  netByCategory: c => sum(sales().filter(r => product(r.ProductKey).Category === c), net),
  pctByCategory: c => F.netByCategory(c) / F.net(),
  returnLines: () => sales().filter(r => num(r.Quantity) < 0).length,
  netBySalesRegion: n => sum(sales().filter(r => region(r.RegionKey).RegionName === n), net),
  netByMonth: m => sum(sales().filter(r => month(r.OrderDate) === m), net),
  mom: m => { const prev = { '2026-02': '2026-01', '2026-03': '2026-02' }[m]; return (F.netByMonth(m) - F.netByMonth(prev)) / F.netByMonth(prev); },

  /* iterators */
  avgPerCustomer: () => F.net() / F.customersBuying(),
  bestProduct: () => { const m = by(sales(), r => product(r.ProductKey).ProductName, v => sum(v, net)); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]; },
  bestProductName: () => F.bestProduct()[0],
  bestProductNet: () => F.bestProduct()[1],
  topCustomer: () => { const m = by(sales(), r => customer(r.CustomerKey).CustomerName, v => sum(v, net)); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]; },
  topCustomerName: () => F.topCustomer()[0],
  topCustomerNet: () => F.topCustomer()[1],
  customersOver500: () => Object.values(by(sales(), r => r.CustomerKey, v => sum(v, net))).filter(x => x > 500).length,
  abc: cls => {
    const vals = Object.values(by(sales(), r => r.CustomerKey, v => sum(v, net)));
    const total = vals.reduce((a, b) => a + b, 0);
    return vals.filter(cur => { const cum = vals.filter(x => x >= cur).reduce((a, b) => a + b, 0) / total; return (cum <= 0.7 ? 'A' : cum <= 0.9 ? 'B' : 'C') === cls; }).length;
  },

  /* budget */
  budgetTotal: () => sum(tbl('FactBudget'), r => num(r.BudgetAmount)),
  budgetByMonth: m => sum(tbl('FactBudget').filter(r => r.YearMonth === m), r => num(r.BudgetAmount)),
  budgetByCategory: c => sum(tbl('FactBudget').filter(r => r.Category === c), r => num(r.BudgetAmount)),

  /* hierarchy and security */
  teamSales: n => { const t = team(n); return sum(sales().filter(r => t.has(r.EmployeeKey)), net); },
  teamSize: n => team(n).size,
  ownSales: n => { const e = tbl('DimEmployee').find(x => x.EmployeeName === n); return sum(sales().filter(r => r.EmployeeKey === e.EmployeeKey), net); },
  employeeSales: n => F.ownSales(n),
  rlsRegions: email => { const rows = tbl('UserRegionMapping').filter(r => r.UserEmail === email); return rows.some(r => r.RegionKey === '0') ? 4 : rows.length; },

  /* inventory */
  inventorySum: () => sum(tbl('FactInventory'), r => num(r.QuantityOnHand)),
  stockMonthEnd: m => stockAtMonthEnd(m).qty,
  lastSnapshotDate: m => stockAtMonthEnd(m).date,
  belowReorderCount: m => belowReorder(m).length,
  belowReorderNames: m => belowReorder(m).join(', '),

  /* currency */
  eurPerDay: m => sum(sales().filter(r => month(r.OrderDate) === m), r => net(r) / eurRate(r.OrderDate)),
  eurOnce: m => { const last = tbl('ExchangeRates').filter(r => r.Currency === 'EUR' && month(r.RateDate) === m).sort((a, b) => a.RateDate < b.RateDate ? -1 : 1).pop(); return F.netByMonth(m) / num(last.RateToUSD); },

  /* web analytics */
  sessions: () => sessions().size,
  sessionsWithPurchase: () => [...sessions().values()].filter(v => v.some(e => e.EventType === 'Purchase')).length,
  conversion: () => F.sessionsWithPurchase() / F.sessions(),
  avgSessionMinutes: () => { const s = [...sessions().values()]; return s.reduce((a, v) => { const t = v.map(e => Date.parse(e.EventTime.replace(' ', 'T') + 'Z')); return a + (Math.max(...t) - Math.min(...t)) / 60000; }, 0) / s.length; },
  funnel: step => [...sessions().values()].filter(v => v.some(e => e.EventType === step)).length
};

/* formatting the way the course writes numbers */
const FMT = {
  int: v => String(Math.round(v)),
  thousands: v => Math.round(v).toLocaleString('en-US'),
  money: v => '$' + r2(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  money0: v => '$' + Math.round(v).toLocaleString('en-US'),
  num0: v => Math.round(v).toLocaleString('en-US'),
  eur: v => '€' + r2(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  pct0: v => Math.round(v * 100) + '%',
  pct1: v => (Math.round(v * 1000) / 10).toFixed(1) + '%',
  spct1: v => (v < 0 ? '−' : '+') + (Math.round(Math.abs(v) * 1000) / 10).toFixed(1) + '%',
  dec2: v => (Math.round(v * 100) / 100).toFixed(2),
  text: v => String(v),
  raw: v => String(v)
};

module.exports = { F, FMT };
