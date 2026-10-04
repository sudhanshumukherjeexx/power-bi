/* Files for the Skill Mode tracks (data/tracks/...). Seeded and derived from the company pack, so the
   numbers in track assignments are computed (tools/lib/track-facts.js) and checked in CI. */
'use strict';
const csv = require('./csv');
const { company, rng, iso, T, DAY } = require('./company-data');

let cache = null;
function build() {
  if (cache) return cache;
  const c = company();
  const r = rng(4242);
  /* ---------- warehousing: customer attribute changes from the CRM (for SCD type 2) ---------- */
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const segs = ['Consumer', 'Small Business', 'Outfitter'];
  const base = c.customers.filter(x => !x.test).slice(0, 120);
  const changes = [];
  for (const cu of base) {
    let seg = cu.seg, region = cu.region, tier = tiers[Math.floor(r() * 2)];
    changes.push({ id: cu.id, date: '2025-01-01', seg, region, tier, src: 'initial load' });
    const n = r() < 0.55 ? 0 : r() < 0.7 ? 1 : 2;
    let t = T('2025-02-01');
    for (let k = 0; k < n; k++) {
      t += DAY * (20 + Math.floor(r() * 200));
      if (t > T('2026-03-25')) break;
      const what = r();
      if (what < 0.5) tier = tiers[Math.min(3, tiers.indexOf(tier) + 1)];
      else if (what < 0.8) seg = segs[(segs.indexOf(seg) + 1) % 3];
      else region = region === 5 ? 5 : 1 + Math.floor(r() * 4);
      changes.push({ id: cu.id, date: iso(t), seg, region, tier, src: 'CRM' });
    }
  }
  /* two customers that first appear in March orders before the CRM sends them (early-arriving facts) */
  const late = [{ id: 'C20001', date: '2026-03-27', seg: 'Small Business', region: 2, tier: 'Bronze', src: 'CRM (late)' }, { id: 'C20002', date: '2026-03-30', seg: 'Consumer', region: 3, tier: 'Bronze', src: 'CRM (late)' }];
  changes.push(...late);
  /* an exact duplicate change row from a CRM retry */
  const dupSrc = changes.find(x => x.src === 'CRM');
  changes.push(Object.assign({}, dupSrc));
  changes.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const earlyOrders = [
    { OrderID: 'SO-590001', OrderDate: '2026-03-21', CustomerID: 'C20001', Amount: 412.50 },
    { OrderID: 'SO-590002', OrderDate: '2026-03-24', CustomerID: 'C20001', Amount: 189.99 },
    { OrderID: 'SO-590003', OrderDate: '2026-03-26', CustomerID: 'C20002', Amount: 74.99 },
    { OrderID: 'SO-590004', OrderDate: '2026-03-29', CustomerID: 'C20003', Amount: 129.99 }];
  /* ---------- warehousing: order lifecycle events (accumulating snapshot) for March 2026 orders ---------- */
  const events = [];
  const marchOrders = c.orders.filter(o => o.OrderDate >= '2026-03-01' && o.Status === 'Completed' && o.CustomerID !== 'C19999');
  for (const o of marchOrders) {
    const placed = T(o.OrderDate) + o.OrderHour * 3600000;
    events.push([o.OrderID, 'Placed', new Date(placed).toISOString().slice(0, 16).replace('T', ' ')]);
    const picked = placed + (2 + Math.floor(r() * 30)) * 3600000;
    events.push([o.OrderID, 'Picked', new Date(picked).toISOString().slice(0, 16).replace('T', ' ')]);
    if (o.ShipDate && T(o.ShipDate) <= T('2026-04-10')) {
      const shipped = Math.max(picked + 3600000, T(o.ShipDate) + 15 * 3600000);
      events.push([o.OrderID, 'Shipped', new Date(shipped).toISOString().slice(0, 16).replace('T', ' ')]);
      const delivered = shipped + (1 + Math.floor(r() * (o.Channel === 'Wholesale' ? 6 : 4))) * DAY;
      if (delivered <= T('2026-04-10')) events.push([o.OrderID, 'Delivered', new Date(delivered).toISOString().slice(0, 16).replace('T', ' ')]);
    }
  }
  events.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[2] < b[2] ? -1 : 1);
  /* ---------- warehousing: web sessions logged in local time with an offset ---------- */
  const zones = [['America/Los_Angeles', '-07:00', -7], ['America/New_York', '-04:00', -4], ['Europe/Berlin', '+02:00', 2]];
  const sessions = [];
  for (let i = 0; i < 240; i++) {
    const z = zones[Math.floor(r() * 3)];
    const d = T('2026-04-06') + Math.floor(r() * 5) * DAY;
    const minutes = Math.floor(r() * 24 * 60);
    const local = new Date(d + minutes * 60000).toISOString().slice(0, 16).replace('T', ' ');
    sessions.push(['WS' + String(70001 + i), local, z[0], z[1], r() < 0.12 ? 1 : 0]);
  }
  /* ---------- automation: mock REST API responses for a small tenant ---------- */
  const groups = [['a1f4c2e0-0001-4a1e-9c11-000000000001', 'Sales Analytics', true], ['a1f4c2e0-0002-4a1e-9c11-000000000002', 'Finance Board Pack', true], ['a1f4c2e0-0003-4a1e-9c11-000000000003', 'Ops Dashboards', false], ['a1f4c2e0-0004-4a1e-9c11-000000000004', 'Marketing Analytics', false], ['a1f4c2e0-0005-4a1e-9c11-000000000005', 'Sandbox - Sam', false]];
  const datasets = [], reports = [], refreshes = [], views = [];
  const owners = ['sam.patel@northwind.example', 'nina.kowalski@northwind.example', 'kenji.mori@northwind.example', 'marketing.ops@northwind.example'];
  let ds = 1, rp = 1;
  for (const [gid, gname, cap] of groups) {
    const nds = gname.startsWith('Sandbox') ? 3 : 2;
    for (let k = 0; k < nds; k++) {
      const id = `d5e7b000-0000-4000-8000-${String(ds).padStart(12, '0')}`;
      const name = `${gname.split(' ')[0]} ${['Model', 'Detail', 'Test'][k]}`;
      const endorsement = gname === 'Sales Analytics' && k === 0 ? 'Certified' : gname === 'Finance Board Pack' && k === 0 ? 'Certified' : r() < 0.3 ? 'Promoted' : 'None';
      const owner = gname.startsWith('Sandbox') ? owners[0] : owners[Math.floor(r() * owners.length)];
      datasets.push({ id, name, workspaceId: gid, configuredBy: owner, isRefreshable: true, endorsementDetails: endorsement === 'None' ? null : { endorsement }, createdDate: iso(T('2024-01-01') + Math.floor(r() * 700) * DAY) + 'T09:00:00Z' });
      const states = [];
      for (let d = 0; d < 7; d++) states.push(r() < (gname.startsWith('Ops') && k === 1 ? 0.7 : 0.08) ? 'Failed' : 'Completed');
      states.forEach((st, d) => refreshes.push({ datasetId: id, requestId: `rq-${ds}-${d}`, refreshType: 'Scheduled', startTime: `2026-06-${String(1 + d).padStart(2, '0')}T05:00:00Z`, endTime: `2026-06-${String(1 + d).padStart(2, '0')}T05:${String(10 + Math.floor(r() * 40)).padStart(2, '0')}:00Z`, status: st, serviceExceptionJson: st === 'Failed' ? '{"errorCode":"ModelRefresh_ShortMessage_ProcessingError"}' : null }));
      const nrp = 1 + Math.floor(r() * 3);
      for (let j = 0; j < nrp; j++) {
        const rid = `9b3c0000-0000-4000-8000-${String(rp).padStart(12, '0')}`;
        reports.push({ id: rid, name: `${name} ${['Overview', 'Detail', 'Weekly'][j]}`, datasetId: id, workspaceId: gid, modifiedDateTime: iso(T('2025-06-01') + Math.floor(r() * 360) * DAY) + 'T10:00:00Z' });
        const viewDays = gname.startsWith('Sandbox') || r() < 0.25 ? 0 : 1 + Math.floor(r() * 60);
        for (let v = 0; v < viewDays; v++) views.push({ Activity: 'ViewReport', ReportId: rid, UserId: `user${1 + Math.floor(r() * 40)}@northwind.example`, CreationTime: iso(T('2026-03-10') + Math.floor(r() * 90) * DAY) + 'T09:30:00Z' });
        rp++;
      }
      ds++;
    }
  }
  views.sort((a, b) => a.CreationTime < b.CreationTime ? -1 : 1);
  /* ---------- testing: a tiny model with hand-checkable answers ---------- */
  const mini = [
    ['L1', '2025-03-03', '2025-03-05', 'A', 'Tent', 2, 100, 'Online'], ['L2', '2025-03-15', '2025-03-18', 'B', 'Boots', 1, 150, 'Store'],
    ['L3', '2026-01-10', '2026-01-12', 'A', 'Tent', 1, 100, 'Online'], ['L4', '2026-01-10', '2026-01-12', 'A', 'Boots', 2, 150, 'Online'],
    ['L5', '2026-02-20', '2026-02-27', 'C', 'Kayak', 1, 700, 'Store'], ['L6', '2026-03-03', '2026-03-04', 'B', 'Tent', 3, 100, 'Online'],
    ['L7', '2026-03-31', '2026-04-02', 'C', 'Boots', 1, 150, 'Store'], ['L8', '2026-03-31', '2026-04-01', 'D', 'Tent', -1, 100, 'Online']];
  return { changes, earlyOrders, events, sessions, groups, datasets, reports, refreshes, views, mini };
}

function files() {
  const b = build();
  const out = {};
  const put = (p, cols, rows) => out['data/tracks/' + p] = csv.stringify(cols, rows);
  put('warehousing/customer_changes.csv', ['CustomerID', 'EffectiveDate', 'Segment', 'HomeRegionKey', 'LoyaltyTier', 'Source'], b.changes.map(x => [x.id, x.date, x.seg, x.region, x.tier, x.src]));
  put('warehousing/early_orders.csv', ['OrderID', 'OrderDate', 'CustomerID', 'AmountUSD'], b.earlyOrders.map(o => [o.OrderID, o.OrderDate, o.CustomerID, o.Amount.toFixed(2)]));
  put('warehousing/order_events.csv', ['OrderID', 'Event', 'EventTimeUTC'], b.events);
  put('warehousing/web_sessions_local.csv', ['SessionID', 'StartLocal', 'TimeZone', 'UtcOffset', 'Converted'], b.sessions);
  out['data/tracks/automation/groups.json'] = JSON.stringify({ '@odata.context': 'https://api.powerbi.com/v1.0/myorg/$metadata#groups', value: b.groups.map(([id, name, cap]) => ({ id, name, isReadOnly: false, isOnDedicatedCapacity: cap, type: 'Workspace' })) }, null, 2) + '\n';
  out['data/tracks/automation/datasets.json'] = JSON.stringify({ value: b.datasets }, null, 2) + '\n';
  out['data/tracks/automation/reports.json'] = JSON.stringify({ value: b.reports }, null, 2) + '\n';
  out['data/tracks/automation/refreshes.json'] = JSON.stringify({ value: b.refreshes }, null, 2) + '\n';
  out['data/tracks/automation/activity_views.json'] = JSON.stringify({ activityEventEntities: b.views, continuationToken: null, lastResultSet: true }, null, 2) + '\n';
  put('testing/mini_sales.csv', ['LineID', 'OrderDate', 'ShipDate', 'Customer', 'Product', 'Qty', 'UnitPrice', 'Channel'], b.mini);
  out['data/tracks/sql/slow_query.sql'] = SLOW_SQL;
  return out;
}

const SLOW_SQL = `-- The query behind FactSales (SQL Server). Runs for ~22 minutes against NorthwindDW.
-- dbo.OrderLines: 180M rows, clustered on (OrderID, LineNo). dbo.Orders: 72M rows, clustered on OrderID.
-- Nonclustered index IX_Orders_OrderDate ON dbo.Orders(OrderDate). No other indexes.

SELECT *
FROM dbo.OrderLines AS l
JOIN dbo.Orders AS o
  ON CONVERT(varchar(20), o.OrderID) = l.OrderID          -- Orders.OrderID is int, OrderLines.OrderID is varchar(20)
LEFT JOIN dbo.Customers AS c
  ON c.CustomerID = o.CustomerID
WHERE YEAR(o.OrderDate) = 2026
  AND UPPER(o.Status) = 'COMPLETED'
  AND (SELECT COUNT(*) FROM dbo.Returns AS r WHERE r.OrderID = l.OrderID AND r.[LineNo] = l.[LineNo]) = 0
ORDER BY o.OrderDate;

-- Actual execution plan (summary)
--  |--Sort (OrderDate)                                      cost 9%
--     |--Nested Loops (Left Anti Semi Join) per row          cost 21%   <- correlated COUNT(*) on Returns
--        |--Hash Match (Inner Join)                          cost 31%
--        |    |--Clustered Index Scan dbo.Orders  72M rows   cost 18%   <- YEAR() and CONVERT() prevent seeks
--        |    |--Clustered Index Scan dbo.OrderLines 180M    cost 19%
--        |--Table Scan dbo.Returns (executed 41M times)
-- Warnings: implicit conversion on OrderID; 61 columns returned (SELECT *); Power Query keeps 9 of them.
`;

module.exports = { files, build };
