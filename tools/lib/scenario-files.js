/* Evidence files for the Experience Mode scenarios (data/experience/<scenario>/...). Generated, so the
   numbers inside them are consistent with the company pack and with each other. */
'use strict';
const csv = require('./csv');

/* S04: Performance Analyzer capture before the fix, and the same page after (visual, DAX ms, render ms, other ms) */
const S04_PA = [
  ['Card: Net Sales', 410, 38, 12], ['Card: Active Customers', 690, 41, 15], ['Card: Last refreshed', 2210, 35, 10],
  ['Line: Net Sales by Month', 820, 120, 30], ['Matrix: Customers above average by Region', 9840, 310, 60],
  ['Bar: Store Sales YTD by Category', 3120, 95, 25], ['Slicer: Customer Segment', 1180, 22, 8], ['Slicer: Region', 140, 20, 6]];
const S04_AFTER = { 'Card: Last refreshed': 15, 'Matrix: Customers above average by Region': 260, 'Bar: Store Sales YTD by Category': 180, 'Slicer: Customer Segment': 60, 'Card: Net Sales': 310, 'Card: Active Customers': 520, 'Line: Net Sales by Month': 640 };
function rng(seed) { let s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cents = c => (c / 100).toFixed(2);

/* ---------- S03: people, payroll and the security model ---------- */
function people() {
  const r = rng(303);
  const regions = { 1: 'West', 2: 'South', 3: 'East', 4: 'Central', 5: 'Europe' };
  const mgr = { 1: ['Dana Whitfield', 'dana.whitfield'], 2: ['Marcus Bell', 'marcus.bell'], 3: ['Priya Raman', 'priya.raman'], 4: ['Tomas Ekberg', 'tomas.ekberg'], 5: ['Lea Brandt', 'lea.brandt'] };
  const reps = { 1: ['Rosa Delgado', 'Ken Osei', 'Lily Chang', 'Jonah Pike', 'Mae Fontaine'], 2: ['Amara Diallo', 'Sofia Reyes', 'Ben Carver', 'Iris Novak'], 3: ['Bea Lindqvist', 'Omar Haddad', 'Grace Kim', 'Dev Mehta', 'Lucia Moretti'], 4: ['Victor Ilunga', 'Hanna Berg', 'Paul Okoye', 'Nadia Petrov'], 5: ['Jonas Weber', 'Elif Aydin', 'Mateo Rossi', 'Ines Duarte'] };
  const emp = [];
  let k = 1;
  emp.push({ key: k++, name: 'Grace Hollis', title: 'CEO', region: 0, mgr: '', email: 'grace.hollis', dept: 'Executive', base: 21500 });
  emp.push({ key: k++, name: 'Jordan Reed', title: 'VP Sales', region: 0, mgr: 1, email: 'jordan.reed', dept: 'Sales', base: 16800 });
  emp.push({ key: k++, name: 'Sarah Chen', title: 'CFO', region: 0, mgr: 1, email: 'sarah.chen', dept: 'Finance', base: 18900 });
  emp.push({ key: k++, name: 'Nina Kowalski', title: 'Finance Analyst', region: 0, mgr: 3, email: 'nina.kowalski', dept: 'Finance', base: 6900 });
  for (const rg of [1, 2, 3, 4, 5]) {
    const m = { key: k++, name: mgr[rg][0], title: 'Regional Sales Manager', region: rg, mgr: 2, email: mgr[rg][1], dept: 'Sales', base: 9800 + Math.round(r() * 1400) };
    emp.push(m);
    for (const n of reps[rg]) emp.push({ key: k++, name: n, title: 'Sales Representative', region: rg, mgr: m.key, email: n.toLowerCase().replace(' ', '.'), dept: 'Sales', base: 4900 + Math.round(r() * 1900) });
  }
  const payroll = [];
  for (const e of emp) for (const m of ['2026-01', '2026-02', '2026-03']) {
    const bonus = e.dept === 'Sales' && e.title !== 'VP Sales' && m === '2026-03' ? Math.round(e.base * (0.08 + r() * 0.12)) : 0;
    payroll.push({ key: e.key, month: m, gross: e.base, bonus });
  }
  return { emp, payroll, regions };
}

/* ---------- S10: a messy tenant ---------- */
function tenant() {
  const r = rng(1010);
  const depts = ['Sales', 'Finance', 'Operations', 'Marketing', 'HR', 'Supply Chain', 'Ecommerce'];
  const ws = [];
  const wsNames = ['Sales Reporting', 'SALES - Prod', 'sales dev (old)', 'Finance', 'Finance Board Pack', 'Ops Dashboards', 'Operations Team', 'Marketing Analytics', 'Mktg Campaigns 2024', 'HR People Analytics', 'Supply Chain', 'Ecom Insights', 'Ecommerce Prod', 'Executive', 'Test Workspace', 'Dana W (personal share)', 'Data Team Sandbox', 'Regional Reports', 'Analytics CoE'];
  wsNames.forEach((n, i) => ws.push({ id: 'WS' + String(i + 1).padStart(2, '0'), name: n, dept: depts[i % depts.length], admins: 1 + Math.floor(r() * 6), members: 2 + Math.floor(r() * 40), capacity: i % 3 === 0 ? 'F64' : 'Pro', pipeline: [1, 4, 12].includes(i) ? 'Yes' : 'No' }));
  const models = [];
  const custTables = ['Customer', 'DimCustomer', 'Customers', 'tblCustomer', 'Customer Master'];
  const modelNames = ['Sales Model', 'Sales Model v2', 'Finance GL', 'Board Pack Model', 'Ops Fulfilment', 'Ops Inventory', 'Marketing Campaigns', 'Web Analytics', 'HR Headcount', 'Supply Chain Lead Times', 'Ecom Orders', 'Ecom Orders (copy)', 'Executive KPIs', 'Regional Sales', 'Returns Analysis', 'Customer 360', 'Pricing Test', 'Targets 2025', 'Dana Regional'];
  modelNames.forEach((n, i) => {
    const owner = r() < 0.37 ? '' : ['kenji.mori', 'sam.patel', 'elena.torres', 'nina.kowalski', 'dana.whitfield', 'marketing.ops', 'hr.analytics'][Math.floor(r() * 7)];
    const cust = /HR|Supply|Web|Targets|Inventory|Lead/.test(n) ? '' : custTables[Math.floor(r() * custTables.length)];
    models.push({ id: 'SM' + String(i + 1).padStart(2, '0'), name: n, ws: ws[[0, 1, 3, 4, 5, 5, 7, 7, 9, 10, 11, 12, 13, 17, 2, 18, 16, 14, 15][i]].id, sizeMB: Math.round(40 + r() * (n.includes('Sales') || n.includes('Ecom') ? 2600 : 900)), refreshMin: Math.round(3 + r() * 80), endorsement: i === 2 || i === 3 ? 'Certified' : r() < 0.25 ? 'Promoted' : 'None', owner, revenueMeasure: /Sales|Board|Executive|Ecom|Regional|Customer 360|Finance/.test(n) ? ['Revenue', 'Net Sales', 'Total Revenue', 'Sales Amount', 'Revenue (Net)'][Math.floor(r() * 5)] : '', customerTable: cust, rls: r() < 0.4 ? 'Yes' : 'No', lastRefresh: r() < 0.15 ? 'Failed' : 'Succeeded' });
  });
  const reports = [];
  for (let i = 0; i < 80; i++) {
    const m = models[Math.floor(r() * r() * models.length)];
    const views = r() < 0.3 ? 0 : Math.round(Math.pow(r(), 2.2) * 2400);
    const daysOld = Math.round(r() * 900);
    reports.push({ id: 'RP' + String(i + 1).padStart(3, '0'), name: `${m.name.replace(/ \(copy\)| v2/, '')} ${['Overview', 'Detail', 'by Region', 'Weekly', 'Monthly', 'Exec', 'Drilldown', 'Export', 'Old', 'Copy of Overview'][i % 10]}${i > 9 ? ' ' + (Math.floor(i / 10) + 1) : ''}`, ws: m.ws, model: m.id, views90: views, modifiedDaysAgo: daysOld, owner: r() < 0.2 ? '' : m.owner || 'unknown' });
  }
  return { ws, models, reports };
}

function files(c) {
  const out = {};
  const put = (path, cols, rows) => out['data/experience/' + path] = csv.stringify(cols, rows);
  const txt = (path, s) => out['data/experience/' + path] = s.replace(/\r?\n/g, '\n').trimStart() + (s.endsWith('\n') ? '' : '\n');
  const F = require('./company-facts').facts();

  /* ---------- S02 ---------- */
  put('s02/finance_gl_q1_2026.csv', ['Period', 'Account', 'AccountName', 'AmountUSD'], [
    ['2026-01', '4000', 'Product sales', cents(F.fin_sales_jan)], ['2026-01', '4900', 'Returns and allowances', cents(-F.fin_refunds_jan)], ['2026-01', '4910', 'Shipping refunds', cents(-F.fin_ship_jan)],
    ['2026-02', '4000', 'Product sales', cents(F.fin_sales_feb)], ['2026-02', '4900', 'Returns and allowances', cents(-F.fin_refunds_feb)], ['2026-02', '4910', 'Shipping refunds', cents(-F.fin_ship_feb)],
    ['2026-03', '4000', 'Product sales', cents(F.fin_sales_mar)], ['2026-03', '4900', 'Returns and allowances', cents(-F.fin_refunds_mar)], ['2026-03', '4910', 'Shipping refunds', cents(-F.fin_ship_mar)]]);
  put('s02/dashboard_q1_2026.csv', ['Month', 'NetSales (dashboard)'], [['2026-01', cents(F.net_2026_jan)], ['2026-02', cents(F.net_2026_feb)], ['2026-03', cents(F.net_2026_mar)], ['Q1 2026', cents(F.q1_2026_net)]]);

  /* ---------- S03 ---------- */
  const P = people();
  put('s03/employees.csv', ['EmployeeKey', 'EmployeeName', 'Title', 'Department', 'HomeRegionKey', 'ManagerKey', 'Email'], P.emp.map(e => [e.key, e.name, e.title, e.dept, e.region, e.mgr, e.email + '@northwind.example']));
  put('s03/payroll_q1_2026.csv', ['EmployeeKey', 'Month', 'GrossPay', 'Bonus'], P.payroll.map(p => [p.key, p.month, p.gross, p.bonus]));
  put('s03/security_user_region.csv', ['UserEmail', 'RegionKey'], [
    ...[1, 2, 3, 4, 5].map(rg => [P.emp.find(e => e.title === 'Regional Sales Manager' && e.region === rg).email + '@northwind.example', rg]),
    ['nina.kowalski@northwind.example', 1], ['nina.kowalski@northwind.example', 3],
    ...P.emp.filter(e => e.title === 'Sales Representative').map(e => [e.email + '@northwind.example', e.region])]);
  put('s03/relationships.csv', ['FromTable', 'FromColumn', 'ToTable', 'ToColumn', 'Cardinality', 'CrossFilter', 'IsActive'], [
    ['FactSales', 'RegionKey', 'DimRegion', 'RegionKey', 'Many-to-one', 'Single', 'TRUE'],
    ['FactSales', 'EmployeeKey', 'DimEmployee', 'EmployeeKey', 'Many-to-one', 'Single', 'TRUE'],
    ['FactSales', 'OrderDate', 'DimDate', 'Date', 'Many-to-one', 'Single', 'TRUE'],
    ['FactPayroll', 'EmployeeKey', 'DimEmployee', 'EmployeeKey', 'Many-to-one', 'Single', 'TRUE'],
    ['FactPayroll', 'MonthStart', 'DimDate', 'Date', 'Many-to-one', 'Single', 'TRUE'],
    ['DimEmployee', 'HomeRegionKey', 'DimRegion', 'RegionKey', 'Many-to-one', 'Single', 'FALSE']]);
  txt('s03/roles.tmdl', `role 'Regional Manager'
	modelPermission: read

	tablePermission DimRegion =
			VAR u = USERPRINCIPALNAME ()
			RETURN
			    DimRegion[RegionKey]
			        IN CALCULATETABLE (
			            VALUES ( SecurityUserRegion[RegionKey] ),
			            SecurityUserRegion[UserEmail] = u
			        )

	member 'SG-Sales-Managers'

role 'Sales Rep'
	modelPermission: read

	tablePermission DimRegion =
			DimRegion[RegionKey]
			    IN CALCULATETABLE (
			        VALUES ( SecurityUserRegion[RegionKey] ),
			        SecurityUserRegion[UserEmail] = USERPRINCIPALNAME ()
			    )

	member 'SG-Sales-Reps'

role Finance
	modelPermission: read

	member 'SG-Finance'

role Executive
	modelPermission: read

	member 'SG-Executive'
`);
  put('s03/report_page_filters.csv', ['Page', 'FilterLevel', 'Field', 'Condition', 'AddedBy', 'Note'], [
    ['Sales overview', 'Report', 'DimDate[Year]', '2026', 'sam.patel', ''],
    ['Payroll by region', 'Page', 'DimRegion[RegionName]', 'is West', 'sam.patel', 'West app audience only sees this page'],
    ['Payroll by region', 'Visual', 'DimEmployee[Department]', 'is Sales', 'sam.patel', ''],
    ['Team detail', 'Page', '(none)', '', '', '']]);
  put('s03/activity_log.csv', ['Timestamp', 'User', 'Activity', 'Item', 'Client'], [
    ['2026-04-14 08:02', 'dana.whitfield@northwind.example', 'ViewReport', 'Sales & Payroll (app)', 'Browser'],
    ['2026-04-14 08:09', 'dana.whitfield@northwind.example', 'AnalyzeInExcel', 'Sales & Payroll model', 'Excel'],
    ['2026-04-14 08:11', 'dana.whitfield@northwind.example', 'ExecuteQueries', 'Sales & Payroll model', 'Excel'],
    ['2026-04-14 08:26', 'dana.whitfield@northwind.example', 'ExportReport', 'Sales & Payroll (app)', 'Browser'],
    ['2026-04-14 09:40', 'bea.lindqvist@northwind.example', 'ViewReport', 'Sales & Payroll (app)', 'Browser'],
    ['2026-04-14 09:44', 'bea.lindqvist@northwind.example', 'ExploreData', 'Sales & Payroll model', 'Browser']]);

  /* ---------- S04 ---------- */
  const pa = S04_PA;
  out['data/experience/s04/performance_analyzer.json'] = JSON.stringify({ version: '1.1.0', events: pa.map(([v, dax, render, other], i) => ({ visual: v, id: 'v' + (i + 1), metrics: { 'DAX query': dax, 'Visual display': render, Other: other }, durationMs: dax + render + other })), note: 'Captured on the team test machine, cold cache, Monday 08:55, Import model of 31.4M FactSales rows' }, null, 2) + '\n';
  put('s04/server_timings.csv', ['Query', 'TotalMs', 'FormulaEngineMs', 'StorageEngineMs', 'SEQueries', 'SECacheHits', 'Notes'], [
    ['Matrix: Customers above average by Region', 9790, 8930, 860, 4127, 12, 'many small SE queries with identical shape; CallbackDataID present'],
    ['Bar: Store Sales YTD by Category', 3080, 610, 2470, 6, 0, 'one SE query scans all FactSales rows and materialises 31.4M rows'],
    ['Card: Last refreshed', 2180, 15, 2165, 1, 0, 'scan of FactSales[OrderTimestamp]'],
    ['Slicer: Customer Segment', 1150, 760, 390, 34, 2, 'bidirectional filter propagation to FactSales']]);
  put('s04/vertipaq_columns.csv', ['Table', 'Column', 'Cardinality', 'TotalSizeMB', 'DataType', 'Encoding'], [
    ['FactSales', 'OrderTimestamp', 31298411, 1312.4, 'DateTime', 'VALUE'], ['FactSales', 'SalesKey', 31400000, 402.1, 'Int64', 'VALUE'],
    ['FactSales', 'OrderID', 12950000, 288.7, 'String', 'HASH'], ['FactSales', 'NetAmount', 2875302, 61.0, 'Decimal', 'HASH'],
    ['FactSales', 'CustomerKey', 410233, 38.2, 'Int64', 'HASH'], ['FactSales', 'OrderDate', 1182, 9.1, 'DateTime', 'HASH'],
    ['FactSales', 'ProductKey', 24, 3.4, 'Int64', 'HASH'], ['FactSales', 'Channel', 5, 1.2, 'String', 'HASH'],
    ['FactSales', 'Qty', 48, 2.8, 'Int64', 'HASH'], ['DimCustomer', 'CustomerKey', 410233, 6.2, 'Int64', 'VALUE'],
    ['DimCustomer', 'CustomerName', 389114, 14.9, 'String', 'HASH'], ['DimCustomer', 'Segment', 3, 0.1, 'String', 'HASH']]);
  txt('s04/measures.dax', `-- Measures on the executive page (as found in the model, unchanged)

Net Sales = SUM ( FactSales[NetAmount] )

Active Customers =
COUNTROWS ( FILTER ( VALUES ( DimCustomer[CustomerKey] ), [Net Sales] > 0 ) )

Customers Above Average =
COUNTROWS (
    FILTER (
        DimCustomer,
        [Net Sales] > AVERAGEX ( ALL ( DimCustomer ), [Net Sales] )
    )
)

Store Sales YTD =
CALCULATE (
    [Net Sales],
    FILTER (
        ALL ( FactSales ),
        FactSales[Channel] = "Store"
            && FactSales[OrderDate] <= MAX ( DimDate[Date] )
            && YEAR ( FactSales[OrderDate] ) = YEAR ( MAX ( DimDate[Date] ) )
    )
)

Last Refreshed = MAX ( FactSales[OrderTimestamp] )
`);
  txt('s04/model_notes.md', `# Sales model (Import) – notes from the original author

- FactSales: 31.4M rows, one per order line, 2023-01-01 onwards. Grain: order line.
- Relationship DimCustomer[CustomerKey] 1–* FactSales[CustomerKey], **cross-filter: Both** ("so the segment slicer only shows segments with sales").
- OrderTimestamp kept for the "Last refreshed" card on the executive page.
- Model size in memory: 2.21 GB. Capacity: F64. Refresh 41 minutes.
- The page got slower over the last two months; nobody changed the measures.
`);

  /* ---------- S05 ---------- */
  put('s05/revenue_by_model_q1_2026.csv', ['Model', 'Workspace', 'Owner', 'MeasureName', 'Q1 2026 value (USD)'], [
    ['Sales Model', 'Sales Reporting', 'sam.patel', 'Revenue', cents(F.rev_sales_model)],
    ['Finance GL', 'Finance', 'nina.kowalski', 'Revenue', cents(F.rev_finance_model)],
    ['Ops Fulfilment', 'Ops Dashboards', 'kenji.mori', 'Revenue', cents(F.rev_ops_model)]]);
  txt('s05/revenue_measures.tmdl', `/// Sales Model (workspace: Sales Reporting)
measure Revenue = SUMX ( FactOrderLine, FactOrderLine[Qty] * FactOrderLine[UnitPriceUSD] * ( 1 - FactOrderLine[DiscountPct] / 100 ) )
	formatString: \\$#,0
	/// filters: Orders[Status] = "Completed" (report level), date axis uses Orders[OrderDate]

/// Finance GL (workspace: Finance)
measure Revenue = CALCULATE ( SUM ( GL[AmountUSD] ), GL[Account] IN { "4000", "4900", "4910" } )
	formatString: \\$#,0
	/// date axis uses GL[Period] (posting period)

/// Ops Fulfilment (workspace: Ops Dashboards)
measure Revenue = CALCULATE ( SUMX ( Shipments, Shipments[ShippedQty] * Shipments[UnitPriceUSD] * ( 1 - Shipments[DiscountPct] / 100 ) ) )
	formatString: \\$#,0
	/// date axis uses Shipments[ShipDate]
`);
  put('s05/report_inventory.csv', ['Report', 'Workspace', 'Model', 'Owner', 'ViewersLast90d', 'UsesRevenue'], [
    ['Sales Overview', 'Sales Reporting', 'Sales Model', 'sam.patel', 64, 'Yes'], ['Regional Performance', 'Sales Reporting', 'Sales Model', 'sam.patel', 41, 'Yes'],
    ['Executive Summary', 'Executive', 'Sales Model', 'elena.torres', 12, 'Yes'], ['Board Pack', 'Finance', 'Finance GL', 'nina.kowalski', 9, 'Yes'],
    ['Monthly Close', 'Finance', 'Finance GL', 'nina.kowalski', 7, 'Yes'], ['Fulfilment Daily', 'Ops Dashboards', 'Ops Fulfilment', 'kenji.mori', 23, 'Yes'],
    ['Warehouse Backlog', 'Ops Dashboards', 'Ops Fulfilment', 'kenji.mori', 18, 'No'], ['Customer Returns', 'Sales Reporting', 'Sales Model', 'sam.patel', 15, 'Yes'],
    ['Marketing ROI', 'Marketing Analytics', 'Sales Model', '', 6, 'Yes'], ['Commission Calculator', 'Sales Reporting', 'Sales Model', 'sam.patel', 33, 'Yes']]);

  /* ---------- S06 ---------- */
  const tm = (netExpr, netName, fmt, extra) => `table _Measures
	lineageTag: 6f1c2a9e-0d1b-4c1e-9a77-2f6b8d0b0c11

	measure 'Gross Sales' = SUMX ( FactSales, FactSales[Qty] * FactSales[UnitPriceUSD] * ( 1 - FactSales[DiscountPct] / 100 ) )
		formatString: \\$#,0
		displayFolder: Sales
		lineageTag: 0b6d6f4e-8f1a-4c58-a8a4-3b1a6c1d2e01

	measure Refunds = SUM ( FactReturns[RefundUSD] )
		formatString: \\$#,0
		displayFolder: Sales
		lineageTag: 7c0b9b1e-1f0e-4b4b-9a4c-2d2f6a0f8e02

	measure '${netName}' = ${netExpr}
		formatString: ${fmt}
		displayFolder: Sales
		lineageTag: 1a2b3c4d-5e6f-4a1b-8c9d-0e1f2a3b4c03
${extra}`;
  const baseNet = `[Gross Sales] - [Refunds]`;
  const ourNet = `CALCULATE ( [Gross Sales] - [Refunds], KEEPFILTERS ( DimChannel[Channel] <> "Staff" ) )`;
  const ourExtra = `
	measure 'Net Sales LY' = CALCULATE ( [Net Sales], SAMEPERIODLASTYEAR ( DimDate[Date] ) )
		formatString: \\$#,0
		displayFolder: Sales
		lineageTag: 9d8e7f6a-5b4c-4d3e-8f2a-1b0c9d8e7f04
`;
  const theirExtra = `
	measure 'Net Revenue %' = DIVIDE ( [Net Revenue], [Gross Sales] )
		formatString: 0.0%
		displayFolder: Sales
		lineageTag: 4e5f6a7b-8c9d-4e0f-a1b2-c3d4e5f6a705
`;
  txt('s06/base/_Measures.tmdl', tm(baseNet, 'Net Sales', '\\$#,0', ''));
  txt('s06/ours/_Measures.tmdl', tm(ourNet, 'Net Sales', '\\$#,0', ourExtra));
  txt('s06/theirs/_Measures.tmdl', tm(baseNet, 'Net Revenue', '\\$#,0.00', theirExtra));
  txt('s06/conflicted/_Measures.tmdl', `table _Measures
	lineageTag: 6f1c2a9e-0d1b-4c1e-9a77-2f6b8d0b0c11

	measure 'Gross Sales' = SUMX ( FactSales, FactSales[Qty] * FactSales[UnitPriceUSD] * ( 1 - FactSales[DiscountPct] / 100 ) )
		formatString: \\$#,0
		displayFolder: Sales
		lineageTag: 0b6d6f4e-8f1a-4c58-a8a4-3b1a6c1d2e01

	measure Refunds = SUM ( FactReturns[RefundUSD] )
		formatString: \\$#,0
		displayFolder: Sales
		lineageTag: 7c0b9b1e-1f0e-4b4b-9a4c-2d2f6a0f8e02

<<<<<<< HEAD
	measure 'Net Sales' = ${ourNet}
		formatString: \\$#,0
=======
	measure 'Net Revenue' = ${baseNet}
		formatString: \\$#,0.00
>>>>>>> sam/rename-net-revenue
		displayFolder: Sales
		lineageTag: 1a2b3c4d-5e6f-4a1b-8c9d-0e1f2a3b4c03
<<<<<<< HEAD
${ourExtra}=======
${theirExtra}>>>>>>> sam/rename-net-revenue
`);
  out['data/experience/s06/bpa_results.json'] = JSON.stringify({ tool: 'Tabular Editor 2 Best Practice Analyzer', rulesVersion: 'BPARules.json (team copy, 2026-03)', model: 'Sales.SemanticModel', results: [
    { rule: 'Provide a description for visible measures', severity: 2, objects: ["'Gross Sales'", 'Refunds', "'Net Sales'", "'Net Sales LY'"] },
    { rule: 'Measures should have a format string', severity: 2, objects: [] },
    { rule: 'Avoid floating point data types', severity: 2, objects: ['FactSales[UnitPriceUSD]'] },
    { rule: 'Use DIVIDE instead of the / operator', severity: 2, objects: [] },
    { rule: 'Avoid bi-directional relationships against high-cardinality columns', severity: 3, objects: [] }
  ] }, null, 2) + '\n';
  txt('s06/git_log.txt', `$ git log --oneline --graph --all -6
* 8c41f2e (HEAD -> feature/exclude-staff) Exclude Staff channel from Net Sales; add Net Sales LY
| * 51ab0d9 (origin/sam/rename-net-revenue) Rename Net Sales to Net Revenue (Finance wording); add Net Revenue %
|/
* 2e9d6c4 (origin/main, main) Add Refunds and Net Sales measures
* a17b3f0 Initial PBIP: Sales semantic model

$ git merge origin/sam/rename-net-revenue
Auto-merging Sales.SemanticModel/definition/tables/_Measures.tmdl
CONFLICT (content): Merge conflict in Sales.SemanticModel/definition/tables/_Measures.tmdl
Automatic merge failed; fix conflicts and then commit the result.

$ grep -rn "Net Sales" Sales.Report/definition/pages | head -5
Sales.Report/definition/pages/1a2b/visuals/kpi01/visual.json:  "Measure": { "Property": "Net Sales" }
Sales.Report/definition/pages/1a2b/visuals/line02/visual.json:  "Measure": { "Property": "Net Sales" }
Sales.Report/definition/pages/9f3c/visuals/tbl01/visual.json:  "Measure": { "Property": "Net Sales" }
`);

  /* ---------- S07 ---------- */
  out['data/experience/s07/deployment_pipeline.json'] = JSON.stringify({ pipeline: 'Sales Analytics', stages: [
    { order: 0, name: 'Development', workspace: 'Sales Analytics [Dev]' },
    { order: 1, name: 'Test', workspace: 'Sales Analytics [Test]', rules: [{ item: 'Sales (semantic model)', type: 'Parameter', parameter: 'ServerName', value: 'sql-test.northwind.local' }, { item: 'Sales (semantic model)', type: 'Parameter', parameter: 'DatabaseName', value: 'NorthwindDW' }] },
    { order: 2, name: 'Production', workspace: 'Sales Analytics', rules: [{ item: 'Sales (semantic model)', type: 'Parameter', parameter: 'ServerName', value: 'sql-prod.northwind.local' }] }
  ], lastDeployment: { from: 'Test', to: 'Production', at: '2026-06-01 18:12', by: 'sam.patel', items: ['Sales (semantic model)', 'Sales Overview (report)'] } }, null, 2) + '\n';
  put('s07/parameters_by_stage.csv', ['Stage', 'Parameter', 'ValueInModel', 'Source'], [
    ['Development', 'ServerName', 'sql-dev.northwind.local', 'PBIP default'], ['Development', 'DatabaseName', 'NorthwindDW_Dev', 'PBIP default'],
    ['Test', 'ServerName', 'sql-test.northwind.local', 'Deployment rule'], ['Test', 'DatabaseName', 'NorthwindDW', 'Deployment rule'],
    ['Production', 'ServerName', 'sql-prod.northwind.local', 'Deployment rule'], ['Production', 'DatabaseName', 'NorthwindDW_Dev', 'Copied from source stage']]);
  put('s07/sql_databases.csv', ['Server', 'Database', 'Purpose', 'LastRestored', 'RowsInFactSales', 'MaxOrderDate'], [
    ['sql-dev.northwind.local', 'NorthwindDW_Dev', 'Development', '2026-03-01', '2,184,210', '2026-02-28'],
    ['sql-test.northwind.local', 'NorthwindDW', 'Test (nightly copy of prod)', '2026-06-01', '2,301,877', '2026-05-31'],
    ['sql-prod.northwind.local', 'NorthwindDW', 'Production', '', '2,302,415', '2026-06-01'],
    ['sql-prod.northwind.local', 'NorthwindDW_Dev', 'Developer copy restored to prod server for a load test (should have been dropped)', '2026-03-01', '2,184,210', '2026-02-28']]);
  put('s07/datasource_bindings.csv', ['Workspace', 'Item', 'DataSource', 'Gateway', 'GatewayConnection', 'CredentialType', 'CredentialOwner', 'Status'], [
    ['Sales Analytics [Test]', 'Sales', 'SQL sql-test.northwind.local;NorthwindDW', 'GW-PROD-01', 'conn-sql-test-dw', 'Windows (service account)', 'svc_pbi_test', 'OK'],
    ['Sales Analytics [Test]', 'Sales', 'SharePoint Targets.xlsx', '(cloud)', 'conn-sp-targets-test', 'OAuth2', 'svc_pbi_cloud', 'OK'],
    ['Sales Analytics', 'Sales', 'SQL sql-prod.northwind.local;NorthwindDW_Dev', 'GW-PROD-01', 'conn-sql-prod-dwdev', 'Windows (service account)', 'svc_pbi_prod', 'OK'],
    ['Sales Analytics', 'Sales', 'SharePoint Targets.xlsx', '(cloud)', 'conn-sp-targets-prod', 'OAuth2', 'sam.patel@northwind.example', 'Expired 2026-05-27']]);
  put('s07/refresh_history_prod.csv', ['Start', 'End', 'Type', 'Status', 'Message'], [
    ['2026-06-01 18:20', '2026-06-01 18:31', 'On demand', 'Completed', 'Warning: table Targets was not refreshed (credentials expired); previous data kept'],
    ['2026-06-02 05:00', '2026-06-02 05:12', 'Scheduled', 'Completed', 'Warning: table Targets was not refreshed (credentials expired); previous data kept'],
    ['2026-06-03 05:00', '2026-06-03 05:11', 'Scheduled', 'Completed', 'Warning: table Targets was not refreshed (credentials expired); previous data kept']]);
  put('s07/stage_comparison.csv', ['Check', 'Test', 'Production'], [
    ['FactSales rows', '2,301,877', '2,184,210'], ['Max OrderDate', '2026-05-31', '2026-02-28'], ['Net Sales, May 2026', '$98,730', '(blank)'],
    ['Targets rows', '60', '55'], ['Targets latest month', '2026-06', '2026-05']]);

  /* ---------- S08 ---------- */
  const days = ['2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08'];
  /* daily 05:30 refresh; minutes taken. The last completed run (Sun 7 Jun) ends 06:05, then Monday fails at 06:17 */
  const durs = [33, 36, 31, 38, 34, 37, 32, 39, 35, 33, 36, 34, 38, 35, 47];
  const hm = m => `${String(5 + Math.floor((30 + m) / 60)).padStart(2, '0')}:${String((30 + m) % 60).padStart(2, '0')}`;
  put('s08/refresh_history.csv', ['ScheduledStart', 'End', 'DurationMin', 'Status', 'ErrorCode'], days.map((d, i) => {
    const last = i === days.length - 1;
    return [d + ' 05:30', d + ' ' + hm(durs[i]), durs[i], last ? 'Failed' : 'Completed', last ? 'DM_GWPipeline_Gateway_MashupDataAccessError' : ''];
  }));
  txt('s08/refresh_error.json', JSON.stringify({ timestamp: '2026-06-08T06:17:04Z', semanticModel: 'Finance Board Pack', error: { code: 'DM_GWPipeline_Gateway_MashupDataAccessError', pbi_error: 'Expression.Error', details: [
    { table: 'DimCustomer', message: "The column 'CustomerSegment' of the table wasn't found.", source: 'sql-prod.northwind.local;NorthwindDW;dbo.vw_Customer' },
    { table: 'FxRates', message: 'The credentials provided for the SQL source are invalid. (Source at sql-treasury.northwind.local;Treasury.)', source: 'sql-treasury.northwind.local;Treasury;dbo.MonthlyRates' }
  ] }, clusterUri: 'https://wabi-europe-north-b-redirect.analysis.windows.net/', activityId: 'b7e1c0de-0608-4f00-9a17-5a1e5e5ed001' }, null, 2));
  put('s08/vw_customer_columns.csv', ['Column', 'Before (2026-06-07)', 'After (2026-06-08 02:10)'], [
    ['CustomerID', 'nvarchar(10)', 'nvarchar(10)'], ['CustomerName', 'nvarchar(120)', 'nvarchar(120)'], ['CustomerSegment', 'nvarchar(30)', '(removed)'],
    ['Segment', '(none)', 'nvarchar(30)'], ['HomeRegionKey', 'int', 'int'], ['JoinDate', 'date', 'date'], ['IsActive', '(none)', 'bit']]);
  put('s08/change_calendar.csv', ['ChangeID', 'Window', 'System', 'Owner', 'Description', 'BI notified'], [
    ['CHG-4471', '2026-06-08 02:00-03:00', 'NorthwindDW (SQL)', 'kenji.mori', 'Customer view clean-up: rename columns to the new naming standard, add IsActive', 'No'],
    ['CHG-4472', '2026-06-07 22:00-23:00', 'Active Directory', 'it.identity', 'Quarterly rotation of service account passwords (svc_* accounts)', 'Mailing list it-changes@'],
    ['CHG-4480', '2026-06-09 01:00-02:00', 'Gateway GW-PROD-01', 'it.infra', 'Monthly gateway update', 'Yes']]);
  put('s08/gateway_status.csv', ['Time', 'Gateway', 'Member', 'Status', 'CPU%', 'Memory%'], [
    ['2026-06-08 05:25', 'GW-PROD-01', 'gw-prod-01a', 'Online', 12, 41], ['2026-06-08 05:25', 'GW-PROD-01', 'gw-prod-01b', 'Online', 9, 38],
    ['2026-06-08 06:15', 'GW-PROD-01', 'gw-prod-01a', 'Online', 58, 62], ['2026-06-08 06:15', 'GW-PROD-01', 'gw-prod-01b', 'Online', 11, 40]]);
  put('s08/datasource_credentials.csv', ['GatewayConnection', 'Source', 'Account', 'LastSuccessfulAuth', 'Owner'], [
    ['conn-dw-prod', 'sql-prod.northwind.local;NorthwindDW', 'svc_pbi_prod', '2026-06-08 05:31', 'kenji.mori'],
    ['conn-treasury', 'sql-treasury.northwind.local;Treasury', 'svc_treasury_read', '2026-06-07 05:44', 'finance.systems']]);

  /* ---------- S09 ---------- */
  put('s09/current_estate.csv', ['Model', 'StorageMode', 'Rows', 'SizeGB', 'RefreshMin', 'RefreshesPerDay', 'Consumers', 'LatencyNeeded', 'Source'], [
    ['Sales (certified)', 'Import', '182,000,000', '9.8', '74', '2', '140', '4 hours', 'NorthwindDW (SQL Server, on-premises)'],
    ['Finance Board Pack', 'Import', '6,400,000', '0.7', '12', '1', '25', 'Daily, after close', 'NorthwindDW + Treasury'],
    ['Ops Fulfilment', 'DirectQuery', '41,000,000', 'n/a', 'n/a', 'n/a', '60', '15 minutes', 'WMS (SQL Server, on-premises)'],
    ['Web Analytics', 'Import', '96,000,000', '4.1', '55', '1', '20', 'Daily', 'Clickstream files (blob storage)']]);
  put('s09/constraints.csv', ['Constraint', 'Detail'], [
    ['Capacity', 'P1 Premium capacity is being retired at renewal (Dec 2026). Equivalent Fabric capacity is F64.'],
    ['Growth', 'Sales fact grows ~4M rows a month; web clickstream ~8M a month.'],
    ['Latency', 'Operations wants fulfilment status within 15 minutes; everyone else is daily or 4-hourly.'],
    ['Team', '2 BI developers (Power Query, DAX), 1 data engineer (SQL, some Python). No Spark experience.'],
    ['Budget', 'No increase in platform spend next year without a business case; one-off migration effort up to 8 person-weeks.'],
    ['Security', 'RLS by region on Sales; Finance data restricted to Finance group; audit wants one place to manage access.'],
    ['Source load', 'The WMS database team complains that DirectQuery from Power BI causes CPU spikes at 9am.']]);
  put('s09/refresh_and_load.csv', ['Week', 'SalesRefreshMin', 'WMSCpuPeakPct', 'DQQueriesPerHourPeak'], [
    ['2026-W18', 66, 71, 4100], ['2026-W19', 69, 74, 4300], ['2026-W20', 72, 79, 4800], ['2026-W21', 74, 83, 5200]]);

  /* ---------- S10 ---------- */
  const tn = tenant();
  put('s10/workspaces.csv', ['WorkspaceID', 'Name', 'Department', 'Admins', 'Members', 'Capacity', 'DeploymentPipeline'], tn.ws.map(w => [w.id, w.name, w.dept, w.admins, w.members, w.capacity, w.pipeline]));
  put('s10/semantic_models.csv', ['ModelID', 'Name', 'WorkspaceID', 'SizeMB', 'RefreshMin', 'Endorsement', 'Owner', 'RevenueMeasure', 'CustomerTable', 'RLS', 'LastRefresh'], tn.models.map(m => [m.id, m.name, m.ws, m.sizeMB, m.refreshMin, m.endorsement, m.owner, m.revenueMeasure, m.customerTable, m.rls, m.lastRefresh]));
  put('s10/reports.csv', ['ReportID', 'Name', 'WorkspaceID', 'ModelID', 'ViewsLast90Days', 'ModifiedDaysAgo', 'Owner'], tn.reports.map(r => [r.id, r.name, r.ws, r.model, r.views90, r.modifiedDaysAgo, r.owner]));

  /* ---------- D02 ---------- */
  put('d02/nina_excel_region_totals.csv', ['Region', 'Q1 2026 Sales (USD)', 'Formula note'], c.regions.map(rg => [rg[1], cents(F['uat_home_' + rg[1].toLowerCase()]), 'SUMIFS over the customer list export, by customer region']));
  put('d02/report_region_totals.csv', ['Region', 'Gross Sales (USD)'], c.regions.map(rg => [rg[1], cents(F['uat_sales_' + rg[1].toLowerCase()])]));

  /* ---------- D03 ---------- */
  txt('d03/pr-231.diff', `diff --git a/Sales.SemanticModel/definition/tables/FactSales.tmdl b/Sales.SemanticModel/definition/tables/FactSales.tmdl
@@ -41,6 +41,14 @@ table FactSales
 	column DiscountPct
 		dataType: int64
 		summarizeBy: none
+
+	column 'Line Margin' = FactSales[Qty] * ( FactSales[UnitPriceUSD] - RELATED ( DimProduct[UnitCostUSD] ) )
+		dataType: double
+		summarizeBy: sum
+
+	column 'Order Year Text' = FORMAT ( FactSales[OrderDate], "yyyy" )
+		dataType: string
+		summarizeBy: none
diff --git a/Sales.SemanticModel/definition/tables/_Measures.tmdl b/Sales.SemanticModel/definition/tables/_Measures.tmdl
@@ -18,3 +18,22 @@ table _Measures
 		displayFolder: Sales
+
+	measure m1 = SUM ( FactSales[Line Margin] ) / [Gross Sales]
+		formatString: 0.0%
+
+	measure 'Margin %' = DIVIDE ( SUM ( FactSales[Line Margin] ), [Gross Sales] )
+		formatString: 0.0%
+		displayFolder: Sales
+
+	measure 'Sales 2026' = CALCULATE ( [Gross Sales], FactSales[Order Year Text] = "2026" )
+		formatString: \\$#,0
+
+	measure 'Top Customer Sales' = MAXX ( DimCustomer, [Gross Sales] )
+		formatString: \\$#,0
diff --git a/Sales.SemanticModel/definition/relationships.tmdl b/Sales.SemanticModel/definition/relationships.tmdl
@@ -12,6 +12,11 @@ relationship 3f2a9c11-6b7d-4e21-a5f0-0c9d2b8e7a33
 	toColumn: DimDate.Date
+
+relationship 8b1d2e3f-4a5b-4c6d-9e7f-0a1b2c3d4e5f
+	crossFilteringBehavior: bothDirections
+	fromColumn: FactSales.CustomerKey
+	toColumn: DimCustomer.CustomerKey
`);

  /* ---------- D05 ---------- */
  put('d05/usage_weekly.csv', ['WeekStarting', 'Viewers', 'Views'], ['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23', '2026-03-30', '2026-04-06', '2026-04-13', '2026-04-20', '2026-04-27', '2026-05-04', '2026-05-11', '2026-05-18'].map((w, i) => [w, i < 6 ? 38 - (i % 3) : 11 + (i % 2), i < 6 ? 210 + (i * 7) % 30 : 58 + (i * 5) % 12]));
  put('d05/lineage.csv', ['Item', 'Type', 'DependsOn', 'Notes'], [
    ['Regional Sales Weekly', 'Report', 'Regional Sales (semantic model)', 'The report proposed for retirement'],
    ['Regional Sales (semantic model)', 'Semantic model', 'NorthwindDW', ''],
    ['Commission Statement', 'Paginated report', 'Regional Sales (semantic model)', 'Runs on the 1st of each month for Payroll'],
    ['Exec Overview dashboard', 'Dashboard', 'Regional Sales Weekly (tile: Region bar)', 'Pinned tile'],
    ['Regional targets.xlsx', 'Excel (Analyze in Excel)', 'Regional Sales (semantic model)', 'Owned by Finance; refreshed weekly by Nina'],
    ['Sales Overview', 'Report', 'Sales Model (certified)', 'New report most users moved to in April']]);
  put('d05/subscriptions.csv', ['Item', 'Recipients', 'Schedule', 'Owner'], [
    ['Regional Sales Weekly', 'regional-managers@northwind.example', 'Mondays 07:00', 'dana.whitfield'],
    ['Commission Statement', 'payroll@northwind.example', 'Monthly, 1st, 06:00', 'nina.kowalski']]);
  return out;
}

module.exports = { files, people, tenant, S04_PA, S04_AFTER };
