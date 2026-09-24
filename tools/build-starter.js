/* Builds the starter Power BI Project (PBIP + TMDL) with every clean CSV loaded, typed and related.
   Usage (from the project root):
     node tools/build-starter.js <outputFolder> [dataFolder]
   dataFolder defaults to C:\PowerBI\northwind-starter\data\ (it can be a folder path or an https:// address
   ending in /data/). The zip on the website is made from this output plus the CSVs; see README.md. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const out = process.argv[2];
const dataFolder = process.argv[3] || 'C:\\PowerBI\\northwind-starter\\data\\';
if (!out) { console.error('usage: node tools/build-starter.js <outputFolder> [dataFolder]'); process.exit(1); }

const NAME = 'Northwind Starter';
const guid = seed => { const h = crypto.createHash('md5').update('pbi-holy-grail:' + seed).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`; };
const q = n => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : `'${n.replace(/'/g, "''")}'`;

/* column types: i = whole number, d = decimal, s = text, dt = date, ts = date/time, b = true/false */
const TABLES = {
  DimDate: { date: true, cols: { DateKey: 'i', Date: 'dt', Year: 'i', Quarter: 's', MonthNumber: 'i', MonthName: 's', WeekOfYear: 'i', DayOfWeek: 'i', DayName: 's', IsWeekend: 'b', FiscalYear: 's', FiscalQuarter: 's' } },
  DimProduct: { cols: { ProductKey: 'i', ProductName: 's', Category: 's', SubCategory: 's', Brand: 's', UnitCost: 'd', ListPrice: 'd', Discontinued: 'b', LaunchDate: 'dt' } },
  DimCustomer: { cols: { CustomerKey: 'i', CustomerName: 's', Segment: 's', City: 's', State: 's', RegionKey: 'i', JoinDate: 'dt', LoyaltyTier: 's', Email: 's' } },
  DimRegion: { cols: { RegionKey: 'i', RegionName: 's', Country: 's', RegionManager: 's', ManagerEmail: 's', TargetMultiplier: 'd' } },
  DimEmployee: { cols: { EmployeeKey: 'i', EmployeeName: 's', Title: 's', ManagerKey: 'i', RegionKey: 'i', HireDate: 'dt', Salary: 'i', Email: 's' } },
  FactSales: { cols: { SalesKey: 'i', OrderID: 's', OrderDate: 'dt', ShipDate: 'dt', CustomerKey: 'i', ProductKey: 'i', EmployeeKey: 'i', RegionKey: 'i', Quantity: 'i', UnitPrice: 'd', Discount: 'd', Channel: 's' } },
  FactBudget: { cols: { BudgetKey: 'i', YearMonth: 's', RegionKey: 'i', Category: 's', BudgetAmount: 'i', BudgetUnits: 'i' } },
  FactInventory: { cols: { SnapshotDate: 'dt', ProductKey: 'i', WarehouseCode: 's', QuantityOnHand: 'i', ReorderPoint: 'i' } },
  ExchangeRates: { cols: { RateDate: 'dt', Currency: 's', RateToUSD: 'd' } },
  CustomerTargets: { cols: { Segment: 's', LoyaltyTier: 's', Quarter: 's', TargetRevenue: 'i' } },
  WebEvents: { cols: { EventKey: 'i', SessionID: 's', CustomerKey: 'i', EventTime: 'ts', EventType: 's', Page: 's', DeviceType: 's' } },
  UserRegionMapping: { cols: { UserEmail: 's', RegionKey: 'i', AccessLevel: 's' } }
};
/* [from (many), to (one), active] */
const RELATIONSHIPS = [
  ['FactSales.OrderDate', 'DimDate.Date', true],
  ['FactSales.ShipDate', 'DimDate.Date', false],
  ['FactSales.ProductKey', 'DimProduct.ProductKey', true],
  ['FactSales.CustomerKey', 'DimCustomer.CustomerKey', true],
  ['FactSales.EmployeeKey', 'DimEmployee.EmployeeKey', true],
  ['FactSales.RegionKey', 'DimRegion.RegionKey', true],
  ['FactBudget.RegionKey', 'DimRegion.RegionKey', true],
  ['FactInventory.ProductKey', 'DimProduct.ProductKey', true],
  ['FactInventory.SnapshotDate', 'DimDate.Date', true],
  ['WebEvents.CustomerKey', 'DimCustomer.CustomerKey', true],
  ['UserRegionMapping.RegionKey', 'DimRegion.RegionKey', true]
];

const M_TYPE = { i: 'Int64.Type', d: 'type number', s: 'type text', dt: 'type date', ts: 'type datetime', b: 'type logical' };
const TMDL_TYPE = { i: 'int64', d: 'double', s: 'string', dt: 'dateTime', ts: 'dateTime', b: 'boolean' };
const hiddenKey = (t, c) => /Key$/.test(c) && t.startsWith('Fact');

function tableTmdl(name, def) {
  const L = [];
  L.push(`table ${q(name)}`);
  L.push(`\tlineageTag: ${guid(name)}`);
  if (def.date) L.push(`\tdataCategory: Time`);
  L.push('');
  for (const [col, t] of Object.entries(def.cols)) {
    L.push(`\tcolumn ${q(col)}`);
    L.push(`\t\tdataType: ${TMDL_TYPE[t]}`);
    if (def.date && col === 'Date') L.push(`\t\tisKey`);
    if (t === 'dt') L.push(`\t\tformatString: yyyy-mm-dd`);
    if (t === 'ts') L.push(`\t\tformatString: yyyy-mm-dd hh:nn:ss`);
    if (t === 'i') L.push(`\t\tformatString: 0`);
    if (hiddenKey(name, col)) L.push(`\t\tisHidden`);
    L.push(`\t\tlineageTag: ${guid(name + '.' + col)}`);
    const sum = (t === 'i' || t === 'd') && !/Key$|Year|Number|OfWeek|OfYear/.test(col) ? 'sum' : 'none';
    L.push(`\t\tsummarizeBy: ${sum}`);
    L.push(`\t\tsourceColumn: ${col}`);
    L.push('');
    L.push(`\t\tannotation SummarizationSetBy = Automatic`);
    L.push('');
  }
  const types = Object.entries(def.cols).map(([c, t]) => `{"${c}", ${M_TYPE[t]}}`).join(', ');
  const m = [
    'let',
    `    FileName = "${name}.csv",`,
    '    Binary = if Text.StartsWith(DataFolder, "http") then Web.Contents(DataFolder & FileName) else File.Contents(DataFolder & FileName),',
    '    Source = Csv.Document(Binary, [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),',
    '    Promoted = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),',
    `    Typed = Table.TransformColumnTypes(Promoted, {${types}}, "en-US")`,
    'in',
    '    Typed'
  ];
  L.push(`\tpartition ${q(name)} = m`);
  L.push(`\t\tmode: import`);
  L.push(`\t\tsource =`);
  m.forEach(line => L.push(`\t\t\t\t${line}`));
  L.push('');
  L.push(`\tannotation PBI_ResultType = Table`);
  L.push('');
  return L.join('\n');
}

const sm = path.join(out, `${NAME}.SemanticModel`), def = path.join(sm, 'definition'), rep = path.join(out, `${NAME}.Report`);
fs.mkdirSync(path.join(def, 'tables'), { recursive: true });
fs.mkdirSync(rep, { recursive: true });

fs.writeFileSync(path.join(out, `${NAME}.pbip`), JSON.stringify({
  version: '1.0', artifacts: [{ report: { path: `${NAME}.Report` } }], settings: { enableAutoRecovery: true }
}, null, 2) + '\n');

fs.writeFileSync(path.join(sm, 'definition.pbism'), JSON.stringify({ version: '4.0', settings: {} }, null, 2) + '\n');
fs.writeFileSync(path.join(def, 'database.tmdl'), 'database NorthwindStarter\n\tcompatibilityLevel: 1567\n\n');
fs.writeFileSync(path.join(def, 'model.tmdl'), [
  'model Model',
  '\tculture: en-US',
  '\tdefaultPowerBIDataSourceVersion: powerBI_V3',
  '\tsourceQueryCulture: en-US',
  '\tdataAccessOptions',
  '\t\tlegacyRedirects',
  '\t\treturnErrorValuesAsNull',
  '',
  `annotation PBI_QueryOrder = ${JSON.stringify(['DataFolder', ...Object.keys(TABLES)])}`,
  '',
  'annotation __PBI_TimeIntelligenceEnabled = 0',
  '',
  ...Object.keys(TABLES).map(t => `ref table ${q(t)}`),
  ''
].join('\n'));
fs.writeFileSync(path.join(def, 'expressions.tmdl'), [
  `expression DataFolder = "${dataFolder}" meta [IsParameterQuery = true, Type = "Text", IsParameterQueryRequired = true]`,
  `\tlineageTag: ${guid('DataFolder')}`,
  '',
  '\tannotation PBI_ResultType = Text',
  ''
].join('\n'));
for (const [name, d] of Object.entries(TABLES)) fs.writeFileSync(path.join(def, 'tables', name + '.tmdl'), tableTmdl(name, d));
fs.writeFileSync(path.join(def, 'relationships.tmdl'), RELATIONSHIPS.map(([f, t, active]) => {
  const L = [`relationship ${guid(f + '>' + t)}`];
  if (!active) L.push('\tisActive: false');
  L.push(`\tfromColumn: ${f.split('.').map(q).join('.')}`);
  L.push(`\ttoColumn: ${t.split('.').map(q).join('.')}`);
  return L.join('\n') + '\n';
}).join('\n'));

fs.writeFileSync(path.join(rep, 'definition.pbir'), JSON.stringify({
  version: '4.0', datasetReference: { byPath: { path: `../${NAME}.SemanticModel` }, byConnection: null }
}, null, 2) + '\n');
fs.writeFileSync(path.join(rep, 'report.json'), JSON.stringify({
  config: JSON.stringify({ version: '5.43', themeCollection: {}, activeSectionIndex: 0, defaultDrillFilterOtherVisuals: true, objects: {} }),
  layoutOptimization: 0,
  resourcePackages: [],
  sections: [{ config: '{}', displayName: 'Start here', displayOption: 1, filters: '[]', height: 720, name: 'ReportSection', ordinal: 0, visualContainers: [], width: 1280 }]
}, null, 2) + '\n');

fs.writeFileSync(path.join(out, '.gitignore'), '**/.pbi/localSettings.json\n**/.pbi/cache.abf\n');
fs.writeFileSync(path.join(out, 'README.txt'), [
  'Northwind Starter - Power BI Holy Grail',
  '=======================================',
  '',
  '1. Unzip so this folder is C:\\PowerBI\\northwind-starter\\ (the CSVs are in its data\\ subfolder).',
  '2. Open "Northwind Starter.pbip" in Power BI Desktop and click Refresh.',
  '',
  'Unzipped somewhere else? Transform data > Edit parameters > DataFolder, then paste the full path',
  'to the data folder, ending with a backslash. You can also paste the website address of the data',
  'folder (https://<you>.github.io/<repo>/data/) so the model refreshes from the web.',
  '',
  'What is inside: 12 tables, 11 relationships (FactSales.ShipDate -> DimDate is inactive, for',
  'USERELATIONSHIP), DimDate marked as the date table, auto date/time off, no measures.',
  'RawOrdersExport and SurveyWide are not included: cleaning them is part of the Power Query topics.',
  ''
].join('\r\n'));
console.log('Built', out, 'with DataFolder =', dataFolder);
