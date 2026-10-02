/* Facts quoted by the Skill Mode tracks (SQL, warehousing, testing, automation). Track topic text uses
   {{fact|format}} placeholders filled from here; tests/sql.test.js runs the SQL solutions in SQLite and
   compares their output with the same facts. */
'use strict';
module.exports = (c, h) => {
  const F = {};
  const { usd, lineLocal, month, orders, inQ, valid } = h;
  const tb = require('./track-data').build();
  const q1 = o => valid(o) && inQ(o.OrderDate, 2026, 1);
  const val = l => { const o = orders.get(l.OrderID); return usd(lineLocal(l), o.Currency, month(o.OrderDate)); };
  const cust = new Map(c.customers.map(x => [x.id, x]));
  const prod = new Map(c.products.map(p => [p.key, p]));

  /* ---------- SQL track ---------- */
  const q1lines = c.lines.filter(l => q1(orders.get(l.OrderID)));
  F.sql_q1_lines = q1lines.length;
  F.sql_q1_orders = new Set(q1lines.map(l => l.OrderID)).size;
  const byCust = {}; q1lines.forEach(l => { const k = orders.get(l.OrderID).CustomerID; byCust[k] = (byCust[k] || 0) + val(l); });
  const topC = Object.entries(byCust).sort((a, b) => b[1] - a[1]);
  F.sql_top_customer = cust.get(topC[0][0]).name; F.sql_top_customer_id = topC[0][0]; F.sql_top_customer_gross = topC[0][1];
  F.sql_second_customer = cust.get(topC[1][0]).name; F.sql_second_customer_gross = topC[1][1];
  F.sql_buying_customers = topC.length;
  F.sql_customers_without_q1 = c.customers.filter(x => !x.test && !byCust[x.id]).length;
  const byProd = {}; q1lines.forEach(l => { byProd[l.ProductKey] = (byProd[l.ProductKey] || 0) + val(l); });
  const topP = Object.entries(byProd).sort((a, b) => b[1] - a[1]);
  [0, 1, 2].forEach(i => { F[`sql_top${i + 1}_product`] = prod.get(+topP[i][0]).name; F[`sql_top${i + 1}_product_gross`] = topP[i][1]; });
  let run = 0;
  for (const [m, n] of [['01', 'jan'], ['02', 'feb'], ['03', 'mar']]) {
    const g = q1lines.filter(l => orders.get(l.OrderID).OrderDate.slice(5, 7) === m).reduce((a, l) => a + val(l), 0);
    run += g; F[`sql_gross_${n}`] = g; F[`sql_running_${n}`] = run;
  }
  F.sql_exported_rows = c.exported.length; F.sql_distinct_rows = c.lines.length; F.sql_dup_rows = c.exported.length - c.lines.length;
  /* incremental extraction: orders changed after the watermark 2026-03-24 (by order date) */
  F.sql_watermark = '2026-03-24';
  F.sql_incremental_orders = c.orders.filter(o => o.OrderDate > F.sql_watermark).length;
  F.sql_all_orders = c.orders.length;
  /* returned lines: anti-join */
  const returned = new Set(c.returns.map(x => x.OrderID + '|' + x.LineNo));
  F.sql_q1_lines_not_returned = q1lines.filter(l => !returned.has(l.OrderID + '|' + l.LineNo)).length;
  F.sql_q1_lines_returned = F.sql_q1_lines - F.sql_q1_lines_not_returned;
  F.sql_customers_total = c.customers.filter(x => !x.test).length;
  F.sql_top_share = F.sql_top_customer_gross / q1lines.reduce((a, l) => a + val(l), 0);
  F.sql_lookback_from = '2026-03-17';
  F.sql_lookback_orders = c.orders.filter(o => o.OrderDate > F.sql_lookback_from).length;
  /* rows the slow source query returns: completed 2026 orders, raw exported lines, no return on the line */
  F.sql_slow_rows = c.exported.filter(l => { const o = orders.get(l.OrderID); return o.Status === 'Completed' && o.OrderDate >= '2026-01-01' && !returned.has(l.OrderID + '|' + l.LineNo); }).length;
  /* days to first return */
  const rq1 = c.returns.filter(x => q1(orders.get(x.OrderID)));
  F.sql_q1_returns = rq1.length;
  F.sql_avg_days_to_return = rq1.reduce((a, x) => a + (Date.parse(x.ReturnDate) - Date.parse(orders.get(x.OrderID).OrderDate)) / 86400000, 0) / rq1.length;

  /* ---------- warehousing ---------- */
  const ch = tb.changes;
  F.dw_change_rows = ch.length;
  const seen = new Set(); const ded = ch.filter(x => { const k = [x.id, x.date, x.seg, x.region, x.tier].join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
  F.dw_duplicate_changes = ch.length - ded.length;
  /* the CRM sometimes sends a "change" where no tracked attribute changed: SCD2 must not create a version */
  const versions = ded.filter((x, i) => { const p = ded[i - 1]; return !(p && p.id === x.id && p.seg === x.seg && p.region === x.region && p.tier === x.tier); });
  F.dw_noop_changes = ded.length - versions.length;
  F.dw_scd2_rows = versions.length;
  const ids = [...new Set(versions.map(x => x.id))];
  F.dw_customers = ids.length;
  F.dw_customers_with_history = ids.filter(id => versions.filter(x => x.id === id).length > 1).length;
  F.dw_current_rows = ids.length;
  F.dw_historical_rows = versions.length - ids.length;
  const someone = ids.find(id => versions.filter(x => x.id === id).length >= 3) || ids.find(id => versions.filter(x => x.id === id).length > 1);
  F.dw_example_customer = someone;
  F.dw_example_versions = versions.filter(x => x.id === someone).length;
  const exV = versions.filter(x => x.id === someone);
  F.dw_example_first_tier = exV[0].tier; F.dw_example_current_tier = exV[exV.length - 1].tier; F.dw_example_last_change = exV[exV.length - 1].date;
  const eo = tb.earlyOrders;
  F.dw_early_orders = eo.length;
  F.dw_early_resolved = eo.filter(o => ded.some(x => x.id === o.CustomerID)).length;
  F.dw_early_unknown = eo.length - F.dw_early_resolved;
  /* accumulating snapshot */
  const ev = {}; tb.events.forEach(([id, e, t]) => { (ev[id] = ev[id] || {})[e] = t; });
  const oids = Object.keys(ev);
  F.dw_snapshot_orders = oids.length;
  F.dw_shipped = oids.filter(id => ev[id].Shipped).length;
  F.dw_delivered = oids.filter(id => ev[id].Delivered).length;
  F.dw_open_not_shipped = F.dw_snapshot_orders - F.dw_shipped;
  const hours = (a, b) => (Date.parse(b.replace(' ', 'T') + 'Z') - Date.parse(a.replace(' ', 'T') + 'Z')) / 3600000;
  const p2s = oids.filter(id => ev[id].Shipped).map(id => hours(ev[id].Placed, ev[id].Shipped));
  F.dw_avg_hours_to_ship = p2s.reduce((a, b) => a + b, 0) / p2s.length;
  F.dw_delivered_within_5d = oids.filter(id => ev[id].Delivered && hours(ev[id].Placed, ev[id].Delivered) <= 120).length;
  F.dw_delivered_within_5d_pct = F.dw_delivered_within_5d / F.dw_delivered;
  /* time zones */
  const utcDate = ([, local, , off]) => { const sign = off[0] === '-' ? 1 : -1; const [hh, mm] = off.slice(1).split(':').map(Number); return new Date(Date.parse(local.replace(' ', 'T') + 'Z') + sign * (hh * 60 + mm) * 60000).toISOString().slice(0, 10); };
  F.dw_sessions = tb.sessions.length;
  F.dw_sessions_date_shift = tb.sessions.filter(s => utcDate(s) !== s[1].slice(0, 10)).length;
  F.dw_sessions_utc_0407 = tb.sessions.filter(s => utcDate(s) === '2026-04-07').length;
  F.dw_sessions_local_0407 = tb.sessions.filter(s => s[1].slice(0, 10) === '2026-04-07').length;

  /* junk dimension: combinations of low-cardinality flags actually present on orders */
  F.dw_junk_combos = new Set(c.orders.map(o => [o.Channel, o.Status, o.Currency].join('|'))).size;
  F.dw_junk_possible = new Set(c.orders.map(o => o.Channel)).size * new Set(c.orders.map(o => o.Status)).size * new Set(c.orders.map(o => o.Currency)).size;
  /* multi-currency: Europe Q1 2026 in EUR and in USD */
  const eu = q1lines.filter(l => orders.get(l.OrderID).Currency === 'EUR');
  F.dw_eur_q1_local = eu.reduce((a, l) => a + lineLocal(l), 0);
  F.dw_eur_q1_usd = eu.reduce((a, l) => a + val(l), 0);
  F.dw_eur_q1_usd_at_q1end = Math.round(F.dw_eur_q1_local * c.fxOf('2026-03'));
  /* course data used by the warehousing track */
  const ccsv = require('./csv'), cpath = require('path').join(__dirname, '..', '..', 'site', 'data');
  const inv = ccsv.objects(cpath + '/FactInventory.csv');
  for (const [m, n] of [['2026-01', 'jan'], ['2026-02', 'feb'], ['2026-03', 'mar']]) {
    const ds = inv.filter(r => r.SnapshotDate.startsWith(m)).map(r => r.SnapshotDate).sort().pop();
    F[`dw_stock_${n}`] = inv.filter(r => r.SnapshotDate === ds).reduce((a, r) => a + +r.QuantityOnHand, 0);
  }
  F.dw_stock_sum_wrong = inv.reduce((a, r) => a + +r.QuantityOnHand, 0);
  F.dw_snapshots = new Set(inv.map(r => r.SnapshotDate)).size;

  /* testing track: expected RLS results on the course model (net sales by FactSales region) */
  const fsales = ccsv.objects(cpath + '/FactSales.csv'), regs = ccsv.objects(cpath + '/DimRegion.csv'), urm = ccsv.objects(cpath + '/UserRegionMapping.csv');
  const netc = rk => Math.round(fsales.filter(r => rk.includes(r.RegionKey)).reduce((a, r) => a + (+r.Quantity) * (+r.UnitPrice) * (1 - (+r.Discount)) * 100, 0));
  const userRegions = email => { const rows = urm.filter(u => u.UserEmail === email); return rows.some(u => u.RegionKey === '0') ? regs.map(x => x.RegionKey) : rows.map(u => u.RegionKey); };
  F.qa_rls_dana = netc(userRegions('dana.whitfield@northwind.example'));
  F.qa_rls_nina = netc(userRegions('nina.kowalski@northwind.example'));
  F.qa_rls_grace = netc(userRegions('grace.hollis@northwind.example'));
  F.qa_rls_marcus = netc(userRegions('marcus.bell@northwind.example'));
  F.qa_rls_users = new Set(urm.map(u => u.UserEmail)).size;
  F.qa_rls_rows = urm.length;
  /* data-quality suite on the company pack */
  F.qa_orphan_lines = c.exported.filter(l => !orders.get(l.OrderID)).length;
  F.qa_orphan_returns = c.returns.filter(x => !orders.get(x.OrderID)).length;
  F.qa_nonpositive_qty = c.exported.filter(l => !(l.Qty > 0)).length;
  F.qa_returns_over_qty = c.returns.filter(x => { const l = c.lines.find(y => y.OrderID === x.OrderID && y.LineNo === x.LineNo); return !l || x.Qty > l.Qty; }).length;
  F.qa_missing_fx = c.orders.filter(o => o.Currency === 'EUR' && !c.fx.some(f => f.month === o.OrderDate.slice(0, 7))).length;
  F.qa_test_customer_orders = c.orders.filter(o => o.CustomerID === 'C19999').length;
  F.qa_ship_before_order = c.orders.filter(o => o.ShipDate && o.ShipDate < o.OrderDate).length;

  /* ---------- automation (mock REST responses) ---------- */
  F.api_workspaces = tb.groups.length;
  F.api_datasets = tb.datasets.length;
  F.api_reports = tb.reports.length;
  const viewed = new Set(tb.views.map(v => v.ReportId));
  F.api_reports_unused = tb.reports.filter(r => !viewed.has(r.id)).length;
  F.api_views = tb.views.length;
  F.api_unendorsed = tb.datasets.filter(d => !d.endorsementDetails).length;
  F.api_certified = tb.datasets.filter(d => d.endorsementDetails && d.endorsementDetails.endorsement === 'Certified').length;
  const lastRefresh = id => tb.refreshes.filter(x => x.datasetId === id).sort((a, b) => a.startTime < b.startTime ? -1 : 1).pop();
  F.api_last_failed = tb.datasets.filter(d => lastRefresh(d.id).status === 'Failed').length;
  F.api_failed_runs = tb.refreshes.filter(x => x.status === 'Failed').length;
  F.api_refresh_runs = tb.refreshes.length;
  const top = Object.entries(tb.views.reduce((a, v) => (a[v.ReportId] = (a[v.ReportId] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1])[0];
  F.api_top_report = tb.reports.find(r => r.id === top[0]).name; F.api_top_report_views = top[1];

  /* ---------- testing: the mini model ---------- */
  const m = tb.mini.map(([id, od, sd, cu, p, q, pr, chn]) => ({ id, od, sd, cu, p, q, pr, chn, v: q * pr }));
  const s = f => m.filter(f).reduce((a, x) => a + x.v, 0);
  F.qa_total = s(() => true);
  F.qa_2026 = s(x => x.od >= '2026-01-01');
  F.qa_q1_2025 = s(x => x.od >= '2025-01-01' && x.od <= '2025-03-31');
  F.qa_q1_2026 = s(x => x.od >= '2026-01-01' && x.od <= '2026-03-31');
  F.qa_q1_2026_ship = s(x => x.sd >= '2026-01-01' && x.sd <= '2026-03-31');
  F.qa_yoy = F.qa_q1_2026 / F.qa_q1_2025 - 1;
  F.qa_customers_2026 = new Set(m.filter(x => x.od >= '2026-01-01').map(x => x.cu)).size;
  F.qa_customers_mar_2026 = new Set(m.filter(x => x.od.startsWith('2026-03')).map(x => x.cu)).size;
  F.qa_online_q1_2026 = s(x => x.chn === 'Online' && x.od >= '2026-01-01' && x.od <= '2026-03-31');
  F.qa_returns_lines = m.filter(x => x.q < 0).length;
  return F;
};
