/* Scenario-specific facts that need the raw export or scenario files (see company-facts.js for the core
   definitions). Returned keys are merged into the same fact table. */
'use strict';
module.exports = (c, h) => {
  const F = {};
  const { usd, lineLocal, month, orders, inQ } = h;
  const q1 = o => inQ(o.OrderDate, 2026, 1);
  const val = l => { const o = orders.get(l.OrderID); return usd(lineLocal(l), o.Currency, month(o.OrderDate)); };

  /* S01: from the raw export to clean gross sales, one adjustment at a time */
  const raw = c.exported.filter(l => q1(orders.get(l.OrderID)));
  const seen = new Set(); const dedup = [];
  for (const l of raw) { const k = l.OrderID + '|' + l.LineNo; if (!seen.has(k)) { seen.add(k); dedup.push(l); } }
  const noCancel = dedup.filter(l => orders.get(l.OrderID).Status === 'Completed');
  const noTest = noCancel.filter(l => orders.get(l.OrderID).CustomerID !== 'C19999');
  const sum = a => a.reduce((x, l) => x + val(l), 0);
  F.s01_raw = sum(raw); F.s01_raw_lines = raw.length;
  F.s01_bridge_dup = sum(dedup) - sum(raw); F.s01_dup_lines = raw.length - dedup.length;
  F.s01_bridge_cancel = sum(noCancel) - sum(dedup); F.s01_cancel_lines = dedup.length - noCancel.length;
  F.s01_bridge_test = sum(noTest) - sum(noCancel); F.s01_test_lines = noCancel.length - noTest.length;
  F.s01_clean_lines = noTest.length;
  F.s01_clean = sum(noTest);
  F.s01_eur_lines = noTest.filter(l => orders.get(l.OrderID).Currency === 'EUR').length;
  /* last year's deck used the raw export the same naive way (no duplicates existed then) */
  F.naive_q1_2025 = c.exported.filter(l => inQ(orders.get(l.OrderID).OrderDate, 2025, 1)).reduce((x, l) => x + val(l), 0);
  /* naive growth the email implies */
  F.naive_growth = F.s01_raw / F.naive_q1_2025 - 1;

  /* S03: payroll visibility */
  const { people, tenant } = require('./scenario-files');
  const P = people();
  const pay = rg => P.payroll.filter(p => { const e = P.emp.find(x => x.key === p.key); return rg === 'all' ? true : rg === 'regional' ? e.region > 0 : e.region === rg; }).reduce((a, p) => a + p.gross + p.bonus, 0) * 100;
  F.s03_payroll_all = pay('all'); F.s03_payroll_regional = pay('regional');
  for (const [k, n] of [[1, 'west'], [2, 'south'], [3, 'east'], [4, 'central'], [5, 'europe']]) F['s03_payroll_' + n] = pay(k);
  F.s03_payroll_hq = F.s03_payroll_all - F.s03_payroll_regional;
  F.s03_employees = P.emp.length;
  F.s03_reps = P.emp.filter(e => e.title === 'Sales Representative').length;
  F.s03_west_people = P.emp.filter(e => e.region === 1).length;
  F.s03_bridge_rows = P.emp.filter(e => e.title !== 'CEO' && e.region > 0).length + 2;

  /* S04: performance before and after */
  const { S04_PA, S04_AFTER } = require('./scenario-files');
  const tot = rows => rows.reduce((a, r) => a + r[1] + r[2] + r[3], 0);
  F.s04_before_ms = tot(S04_PA);
  F.s04_after_ms = tot(S04_PA.map(r => [r[0], S04_AFTER[r[0]] !== undefined ? S04_AFTER[r[0]] : r[1], r[2], r[3]]));
  F.s04_matrix_before = S04_PA.find(r => r[0].startsWith('Matrix'))[1];
  F.s04_improvement = 1 - F.s04_after_ms / F.s04_before_ms;
  for (const r of S04_PA) { const k = r[0].toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, ''); F['s04_b_' + k] = r[1]; F['s04_a_' + k] = S04_AFTER[r[0]] !== undefined ? S04_AFTER[r[0]] : r[1]; F['s04_i_' + k] = 1 - F['s04_a_' + k] / r[1]; }

  /* S10: the tenant inventory */
  const tn = tenant();
  F.s10_workspaces = tn.ws.length; F.s10_models = tn.models.length; F.s10_reports = tn.reports.length;
  F.s10_zero_view_reports = tn.reports.filter(r => r.views90 === 0).length;
  F.s10_low_view_reports = tn.reports.filter(r => r.views90 > 0 && r.views90 < 10).length;
  F.s10_no_owner_models = tn.models.filter(m => !m.owner).length;
  F.s10_no_owner_reports = tn.reports.filter(r => !r.owner || r.owner === 'unknown').length;
  F.s10_certified = tn.models.filter(m => m.endorsement === 'Certified').length;
  F.s10_unendorsed = tn.models.filter(m => m.endorsement === 'None').length;
  F.s10_revenue_names = new Set(tn.models.map(m => m.revenueMeasure).filter(Boolean)).size;
  F.s10_revenue_models = tn.models.filter(m => m.revenueMeasure).length;
  F.s10_customer_tables = new Set(tn.models.map(m => m.customerTable).filter(Boolean)).size;
  F.s10_customer_models = tn.models.filter(m => m.customerTable).length;
  F.s10_failed_refresh = tn.models.filter(m => m.lastRefresh === 'Failed').length;
  F.s10_pipelines = tn.ws.filter(w => w.pipeline === 'Yes').length;
  F.s10_models_no_reports = tn.models.filter(m => !tn.reports.some(r => r.model === m.id)).length;
  F.s10_total_gb = tn.models.reduce((a, m) => a + m.sizeMB, 0) / 1024;
  const top = Object.entries(tn.reports.reduce((a, r) => (a[r.model] = (a[r.model] || 0) + r.views90, a), {})).sort((a, b) => b[1] - a[1]);
  const totViews = top.reduce((a, x) => a + x[1], 0);
  F.s10_top3_view_share = (top[0][1] + top[1][1] + top[2][1]) / totViews;
  F.s10_top3_models = top.slice(0, 3).map(([id]) => tn.models.find(m => m.id === id).name).join(', ');
  return F;
};
