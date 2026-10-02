/* Every number Experience Mode quotes, computed from the company pack. Scenario text uses
   {{name|format}} placeholders that the build fills from here, so the text cannot drift from the data.
   Money is kept in integer cents; EUR converts to USD with the monthly average rate. */
'use strict';
const { company } = require('./company-data');

let cache = null;
function facts() {
  if (cache) return cache;
  const c = company();
  const F = {};
  const orders = new Map(c.orders.map(o => [o.OrderID, o]));
  const cust = new Map(c.customers.map(x => [x.id, x]));
  const prod = new Map(c.products.map(p => [p.key, p]));
  const month = d => d.slice(0, 7);
  const fx = (cur, m) => cur === 'EUR' ? c.fxOf(m) : 1;
  const usd = (cents, cur, m) => Math.round(cents * fx(cur, m));
  const lineLocal = l => Math.round(l.Qty * l.UnitPrice * (100 - l.DiscountPct) / 100);
  const inQ = (d, y, q) => d >= `${y}-${['01', '04', '07', '10'][q - 1]}-01` && d <= `${y}-${['03', '06', '09', '12'][q - 1]}-${['31', '30', '30', '31'][q - 1]}`;
  const valid = o => o.Status === 'Completed' && o.CustomerID !== 'C19999';
  const lines = c.lines;                                   /* de-duplicated lines */
  const lineOrder = l => orders.get(l.OrderID);

  /* gross sales after discount, by order date, USD at order-month rate */
  const grossBy = (pred) => lines.reduce((a, l) => { const o = lineOrder(l); return pred(o, l) ? a + usd(lineLocal(l), o.Currency, month(o.OrderDate)) : a; }, 0);
  const refundsByOrderDate = (pred) => c.returns.reduce((a, x) => { const o = orders.get(x.OrderID); return pred(o, x) ? a + usd(x.RefundAmount, o.Currency, month(o.OrderDate)) : a; }, 0);
  const qOrders = (y, q) => (o) => valid(o) && inQ(o.OrderDate, y, q);

  /* ---------- S01: the dashboard definitions agreed with Sales ---------- */
  for (const [y, tag] of [[2025, 'q1_2025'], [2026, 'q1_2026']]) {
    F[`${tag}_gross`] = grossBy(qOrders(y, 1));
    F[`${tag}_refunds`] = refundsByOrderDate(qOrders(y, 1));
    F[`${tag}_net`] = F[`${tag}_gross`] - F[`${tag}_refunds`];
    F[`${tag}_orders`] = c.orders.filter(qOrders(y, 1)).length;
  }
  F.yoy_gross = F.q1_2026_gross / F.q1_2025_gross - 1;
  F.yoy_net = F.q1_2026_net / F.q1_2025_net - 1;
  for (const [m, name] of [['01', 'jan'], ['02', 'feb'], ['03', 'mar']]) {
    const n26 = grossBy(o => valid(o) && month(o.OrderDate) === '2026-' + m) - refundsByOrderDate(o => valid(o) && month(o.OrderDate) === '2026-' + m);
    const n25 = grossBy(o => valid(o) && month(o.OrderDate) === '2025-' + m) - refundsByOrderDate(o => valid(o) && month(o.OrderDate) === '2025-' + m);
    F[`net_2026_${name}`] = n26; F[`net_2025_${name}`] = n25; F[`yoy_${name}`] = n26 / n25 - 1;
  }
  for (const ch of ['Online', 'Store', 'Wholesale', 'Marketplace', 'Staff']) {
    F[`gross_q1_2026_${ch.toLowerCase()}`] = grossBy((o) => qOrders(2026, 1)(o) && o.Channel === ch);
    F[`gross_q1_2025_${ch.toLowerCase()}`] = grossBy((o) => qOrders(2025, 1)(o) && o.Channel === ch);
  }
  F.summit_q1_2025 = grossBy(o => qOrders(2025, 1)(o) && o.CustomerID === 'C10077');
  F.summit_q1_2026 = grossBy(o => qOrders(2026, 1)(o) && o.CustomerID === 'C10077');
  F.summit_last_order = c.orders.filter(o => o.CustomerID === 'C10077' && valid(o)).map(o => o.OrderDate).sort().pop();
  F.summit_drop = F.summit_q1_2025 - F.summit_q1_2026;
  F.wholesale_ex_summit_change = (F.gross_q1_2026_wholesale - F.summit_q1_2026) - (F.gross_q1_2025_wholesale - F.summit_q1_2025);
  F.drift_refunds_q1_2026 = refundsByOrderDate((o, x) => qOrders(2026, 1)(o) && lines.find(l => l.OrderID === x.OrderID && l.LineNo === x.LineNo).ProductKey === 20);
  F.drift_refunds_q1_2025 = refundsByOrderDate((o, x) => qOrders(2025, 1)(o) && lines.find(l => l.OrderID === x.OrderID && l.LineNo === x.LineNo).ProductKey === 20);
  const driftUnits = (y) => lines.filter(l => l.ProductKey === 20 && qOrders(y, 1)(lineOrder(l))).reduce((a, l) => a + l.Qty, 0);
  const driftRet = (y) => c.returns.filter(x => { const o = orders.get(x.OrderID); return qOrders(y, 1)(o) && lines.find(l => l.OrderID === x.OrderID && l.LineNo === x.LineNo).ProductKey === 20; }).reduce((a, x) => a + x.Qty, 0);
  F.drift_units_q1_2026 = driftUnits(2026); F.drift_returned_q1_2026 = driftRet(2026); F.drift_return_rate_2026 = F.drift_returned_q1_2026 / F.drift_units_q1_2026;
  F.drift_units_q1_2025 = driftUnits(2025); F.drift_returned_q1_2025 = driftRet(2025);
  F.marketplace_q1_2026_share = F.gross_q1_2026_marketplace / F.q1_2026_gross;
  /* data-quality traps */
  F.dup_lines = c.dupCount;
  const dupValue = c.exported.length - c.lines.length === c.dupCount ? (() => { const seen = new Set(); let v = 0; for (const l of c.exported) { const k = l.OrderID + '|' + l.LineNo; if (seen.has(k)) { const o = lineOrder(l); v += usd(lineLocal(l), o.Currency, month(o.OrderDate)); } seen.add(k); } return v; })() : NaN;
  F.dup_value = dupValue;
  F.cancelled_q1_2026 = c.orders.filter(o => o.Status === 'Cancelled' && inQ(o.OrderDate, 2026, 1)).length;
  F.cancelled_q1_2026_value = grossBy(o => o.Status === 'Cancelled' && inQ(o.OrderDate, 2026, 1));
  F.cancelled_total = c.orders.filter(o => o.Status === 'Cancelled').length;
  F.test_orders = c.orders.filter(o => o.CustomerID === 'C19999').length;
  F.test_value_q1_2026 = grossBy(o => o.CustomerID === 'C19999' && inQ(o.OrderDate, 2026, 1));
  /* a naive sum of the raw export (duplicates, cancelled orders and the test account included) */
  F.naive_q1_2026 = c.exported.reduce((a, l) => { const o = lineOrder(l); return inQ(o.OrderDate, 2026, 1) ? a + usd(lineLocal(l), o.Currency, month(o.OrderDate)) : a; }, 0);
  F.rows_orders = c.orders.length; F.rows_lines_exported = c.exported.length; F.rows_lines = c.lines.length; F.rows_returns = c.returns.length; F.rows_customers = c.customers.length;
  F.extract_date = c.EXTRACT;

  /* ---------- S02: Finance's definition and the bridge ---------- */
  const notStaff = o => o.Channel !== 'Staff';
  const salesByPosting = (pred) => lines.reduce((a, l) => { const o = lineOrder(l); return pred(o) ? a + usd(lineLocal(l), o.Currency, month(o.PostingDate)) : a; }, 0);
  const retByReturnDate = (pred, field) => c.returns.reduce((a, x) => { const o = orders.get(x.OrderID); return pred(o, x) ? a + usd(x[field], o.Currency, month(x.ReturnDate)) : a; }, 0);
  const finQ = (y, q) => ({
    sales: salesByPosting(o => valid(o) && notStaff(o) && inQ(o.PostingDate, y, q)),
    refunds: retByReturnDate((o, x) => valid(o) && notStaff(o) && inQ(x.ReturnDate, y, q), 'RefundAmount'),
    ship: retByReturnDate((o, x) => valid(o) && notStaff(o) && inQ(x.ReturnDate, y, q), 'ShippingRefund')
  });
  const fin = finQ(2026, 1);
  F.fin_sales_q1_2026 = fin.sales; F.fin_refunds_q1_2026 = fin.refunds; F.fin_ship_q1_2026 = fin.ship;
  F.fin_net_q1_2026 = fin.sales - fin.refunds - fin.ship;
  F.dash_net_q1_2026 = F.q1_2026_net;
  F.gap_q1_2026 = F.dash_net_q1_2026 - F.fin_net_q1_2026;
  /* bridge from the dashboard to Finance, one cause at a time */
  F.bridge_staff = -(grossBy(o => qOrders(2026, 1)(o) && !notStaff(o)) - refundsByOrderDate(o => qOrders(2026, 1)(o) && !notStaff(o)));
  F.bridge_posting = salesByPosting(o => valid(o) && notStaff(o) && inQ(o.PostingDate, 2026, 1)) - grossBy(o => qOrders(2026, 1)(o) && notStaff(o));
  F.bridge_returns = refundsByOrderDate(o => qOrders(2026, 1)(o) && notStaff(o)) - fin.refunds;
  F.bridge_shipping = -fin.ship;
  F.bridge_sum = F.bridge_staff + F.bridge_posting + F.bridge_returns + F.bridge_shipping;
  /* pieces learners can find */
  F.posting_into_q1 = salesByPosting(o => valid(o) && notStaff(o) && inQ(o.PostingDate, 2026, 1) && !inQ(o.OrderDate, 2026, 1));
  F.posting_out_of_q1 = salesByPosting(o => valid(o) && notStaff(o) && inQ(o.OrderDate, 2026, 1) && !inQ(o.PostingDate, 2026, 1));
  F.posting_orders_out = c.orders.filter(o => valid(o) && notStaff(o) && inQ(o.OrderDate, 2026, 1) && !inQ(o.PostingDate, 2026, 1)).length;
  F.posting_orders_in = c.orders.filter(o => valid(o) && notStaff(o) && inQ(o.PostingDate, 2026, 1) && !inQ(o.OrderDate, 2026, 1)).length;
  F.returns_april_for_q1 = refundsByOrderDate((o, x) => qOrders(2026, 1)(o) && notStaff(o) && x.ReturnDate > '2026-03-31');
  F.returns_q1_for_prior = retByReturnDate((o, x) => valid(o) && notStaff(o) && inQ(x.ReturnDate, 2026, 1) && o.OrderDate < '2026-01-01', 'RefundAmount');
  F.staff_q1_2026 = -F.bridge_staff;
  for (const [m, name] of [['01', 'jan'], ['02', 'feb'], ['03', 'mar']]) {
    const p = '2026-' + m;
    F[`fin_sales_${name}`] = salesByPosting(o => valid(o) && notStaff(o) && month(o.PostingDate) === p);
    F[`fin_refunds_${name}`] = retByReturnDate((o, x) => valid(o) && notStaff(o) && month(x.ReturnDate) === p, 'RefundAmount');
    F[`fin_ship_${name}`] = retByReturnDate((o, x) => valid(o) && notStaff(o) && month(x.ReturnDate) === p, 'ShippingRefund');
  }

  /* ---------- S05: three departmental Revenue measures for Q1 2026 ---------- */
  F.rev_sales_model = F.q1_2026_gross;                     /* Sales: order date, after discount, all channels, no returns */
  F.rev_finance_model = F.fin_net_q1_2026;                 /* Finance: ledger definition */
  F.rev_ops_model = lines.reduce((a, l) => { const o = lineOrder(l); return valid(o) && o.ShipDate && inQ(o.ShipDate, 2026, 1) ? a + usd(lineLocal(l), o.Currency, month(o.ShipDate)) : a; }, 0);
  F.rev_spread = Math.max(F.rev_sales_model, F.rev_finance_model, F.rev_ops_model) - Math.min(F.rev_sales_model, F.rev_finance_model, F.rev_ops_model);

  /* ---------- D02 UAT: region totals by sales region vs customer home region (Q1 2026 gross) ---------- */
  for (const [k, n] of c.regions.map(x => [x[0], x[1].toLowerCase()])) {
    F[`uat_sales_${n}`] = grossBy(o => qOrders(2026, 1)(o) && o.SalesRegionKey === k);
    F[`uat_home_${n}`] = grossBy(o => qOrders(2026, 1)(o) && cust.get(o.CustomerID).region === k);
  }
  F.uat_cross_orders = c.orders.filter(o => qOrders(2026, 1)(o) && o.SalesRegionKey !== cust.get(o.CustomerID).region).length;

  /* ---------- D06 change requests ---------- */
  /* CR1: returns reduce revenue in the month of ReturnDate instead of the order's month (dashboard otherwise unchanged) */
  F.cr1_net_q1_2026 = F.q1_2026_gross - retByReturnDate((o, x) => valid(o) && inQ(x.ReturnDate, 2026, 1), 'RefundAmount');
  F.cr1_delta = F.cr1_net_q1_2026 - F.q1_2026_net;
  /* CR2: shipping refunds also reduce revenue (on top of CR1) */
  F.cr2_ship = retByReturnDate((o, x) => valid(o) && inQ(x.ReturnDate, 2026, 1), 'ShippingRefund');
  F.cr2_net_q1_2026 = F.cr1_net_q1_2026 - F.cr2_ship;
  /* CR4: 4-4-5 fiscal calendar. FY2026 starts Sunday 28 Dec 2025; Q1 = 13 weeks to Saturday 28 Mar 2026 */
  F.f445_q1_start = '2025-12-28'; F.f445_q1_end = '2026-03-28';
  F.f445_p1_end = '2026-01-24'; F.f445_p2_end = '2026-02-21';
  F.cr4_gross_q1 = grossBy(o => valid(o) && o.OrderDate >= F.f445_q1_start && o.OrderDate <= F.f445_q1_end);
  F.cr4_delta = F.cr4_gross_q1 - F.q1_2026_gross;
  F.cr4_p1 = grossBy(o => valid(o) && o.OrderDate >= '2025-12-28' && o.OrderDate <= '2026-01-24');
  F.cr4_p2 = grossBy(o => valid(o) && o.OrderDate >= '2026-01-25' && o.OrderDate <= '2026-02-21');
  F.cr4_p3 = grossBy(o => valid(o) && o.OrderDate >= '2026-02-22' && o.OrderDate <= '2026-03-28');

  Object.assign(F, require('./scenario-facts')(c, { grossBy, valid, inQ, usd, lineLocal, month, orders, cust, prod, lines }));
  Object.assign(F, require('./track-facts')(c, { grossBy, valid, inQ, usd, lineLocal, month, orders, cust, prod, lines }));
  cache = F;
  return F;
}

/* formats used in scenario text */
const FMT = {
  money: v => (v < 0 ? '−' : '') + '$' + (Math.abs(v) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  money0: v => (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v) / 100).toLocaleString('en-US'),
  smoney0: v => (v < 0 ? '−' : '+') + '$' + Math.round(Math.abs(v) / 100).toLocaleString('en-US'),
  moneyk: v => (v < 0 ? '−' : '') + '$' + (Math.abs(v) / 100000).toFixed(1) + 'k',
  moneym: v => (v < 0 ? '−' : '') + '$' + (Math.abs(v) / 100000000).toFixed(2) + 'M',
  pct1: v => (Math.round(v * 1000) / 10).toFixed(1) + '%',
  spct1: v => (v < 0 ? '−' : '+') + (Math.round(Math.abs(v) * 1000) / 10).toFixed(1) + '%',
  pct0: v => Math.round(v * 100) + '%',
  dec1: v => (Math.round(v * 10) / 10).toFixed(1),
  dec1pct: v => (Math.round(v * 1000) / 10).toFixed(1),
  num2: v => (v / 100).toFixed(2),
  usd: v => (v / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  int: v => Math.round(v).toLocaleString('en-US'),
  text: v => String(v),
  date: v => { const [y, m, d] = String(v).split('-').map(Number); return d + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + y; }
};
function fill(text, where) {
  const F = facts();
  return String(text).replace(/\{\{([a-z0-9_]+)(?:\|([a-z0-9]+))?\}\}/gi, (m, name, fmt) => {
    if (!(name in F)) throw new Error(`${where}: unknown fact {{${name}}}`);
    const f = FMT[fmt || 'text'];
    if (!f) throw new Error(`${where}: unknown format |${fmt}`);
    const v = F[name];
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`${where}: fact ${name} is not a finite number`);
    return f(v);
  });
}
module.exports = { facts, FMT, fill };
