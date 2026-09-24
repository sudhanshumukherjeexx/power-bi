/* Worked solutions, keyed by assignment id (topicId-index, same as the checkbox ids on index.html).
   s = approach / clicks, code = [language, title, source], tbl = [header row, ...rows],
   check = values computed from the datasets, note = common mistake or a place where the data differs from the text. */
const SOLUTIONS={

/* ================= BEGINNER ================= */
'b-pq-0':{
s:['Load the CSV (or Enter Data) and use Home → Remove Rows → Remove Top Rows (1) and Remove Bottom Rows (1).','Rename headers first: the raw headers contain trailing spaces ("customer name ", "Region ") that are easy to miss.','Clean the text columns, then replace "$", " USD", "N/A" and blanks, then fix the dates, then set types, and remove duplicates last.','The date column has no single right culture: 01/03/2026 is US (3 Jan) but 06/02/2026 is day-first (6 Feb: it sits between orders on 5 Feb and 10 Feb). Fix that one value explicitly and write down why.'],
code:[['M','Full cleaned query (paste into Advanced Editor, adjust the Source step)',
`let
    // If you used Enter Data, keep your own Source step and delete the next two lines
    Source = Csv.Document(File.Contents("C:\\PowerBI\\data\\RawOrdersExport.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Promoted = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),
    RemovedReportHeader = Table.Skip(Promoted, 1),
    RemovedTotalRow = Table.RemoveLastN(RemovedReportHeader, 1),
    RemovedLegacyFlag = Table.RemoveColumns(RemovedTotalRow, {"LegacyFlag"}),
    Renamed = Table.RenameColumns(RemovedLegacyFlag, {
        {"Order Ref", "OrderRef"}, {"Order Dt", "OrderDate"}, {"customer name ", "CustomerName"},
        {"PRODUCT", "Product"}, {"Unit Price", "UnitPrice"}, {"Region ", "Region"}}),
    TrimmedAndCleaned = Table.TransformColumns(Renamed, {}, each if _ is text then Text.Clean(Text.Trim(_)) else _),
    StrippedCurrency = Table.TransformColumns(TrimmedAndCleaned,
        {{"UnitPrice", each Text.Replace(Text.Replace(_, "$", ""), " USD", ""), type text}}),
    NAToNull = Table.ReplaceValue(StrippedCurrency, "N/A", null, Replacer.ReplaceValue, {"Qty", "UnitPrice"}),
    BlankToNull = Table.ReplaceValue(NAToNull, "", null, Replacer.ReplaceValue, {"Qty", "Notes"}),
    // 06/02/2026 is day-first in this export (order sequence proves it); every other slash date is US
    FixedAmbiguousDate = Table.ReplaceValue(BlankToNull, "06/02/2026", "2026-02-06", Replacer.ReplaceValue, {"OrderDate"}),
    ParsedDates = Table.TransformColumns(FixedAmbiguousDate, {{"OrderDate", each
        if Text.Middle(_, 2, 1) = "-" then Date.FromText(_, [Format = "dd-MM-yyyy"])
        else Date.FromText(_, [Culture = "en-US"]), type date}}),
    ProperCase = Table.TransformColumns(ParsedDates, {{"CustomerName", Text.Proper, type text}, {"Region", Text.Proper, type text}}),
    Typed = Table.TransformColumnTypes(ProperCase, {
        {"OrderRef", type text}, {"Product", type text}, {"Qty", Int64.Type},
        {"UnitPrice", type number}, {"Notes", type text}}, "en-US"),
    RemovedDuplicates = Table.Distinct(Typed)
in
    RemovedDuplicates`]],
check:'27 rows × 8 columns, zero errors. Region = West, South, East, Central. UnitPrice is null for SO-5026 (it was "N/A").',
note:'Qty ends up with 3 nulls, not 2: SO-5003 and SO-5026 were "N/A", and SO-5015 was blank in the source. Also, don\'t use Text.Proper on Product: it turns "2P", "65L" and "III" into "2p", "65l" and "Iii", which breaks the merge in the next assignment.'},

'b-pq-1':{
s:['Right-click your cleaned query → Reference. Rename the new query "Orders Clean".','Right-click the original query → untick Enable Load. It turns italic.','Edit the Source step (Enter Data → gear icon) or the CSV, then Home → Refresh Preview / Close & Apply.'],
code:[['M','What Reference creates (the whole query)',
`let
    Source = #"RawOrdersExport"
in
    Source`]],
check:'Model view shows exactly one table, "Orders Clean". The changed price appears after refresh with no extra steps.',
note:'Duplicate would copy all the steps. Your fix would then live in two places and drift apart.'},

'b-pq-2':{
s:['Load DimProduct. In Orders Clean: Home → Merge Queries → pick Product and ProductName.','Case matters in Power Query joins. Only "TRAIL CHEF STOVE" fails. Join on an upper-cased key (below) rather than proper-casing the product names.','Expand only Category and ProductKey. Compare the row counts for Left Outer vs Inner.'],
code:[['M','Case-insensitive merge on an upper-cased key',
`let
    Source = #"Orders Clean",
    WithKey = Table.AddColumn(Source, "ProductUpper", each Text.Upper([Product]), type text),
    ProductsWithKey = Table.AddColumn(DimProduct, "ProductUpper", each Text.Upper([ProductName]), type text),
    Merged = Table.NestedJoin(WithKey, {"ProductUpper"}, ProductsWithKey, {"ProductUpper"}, "Product", JoinKind.LeftOuter),
    Expanded = Table.ExpandTableColumn(Merged, "Product", {"Category", "ProductKey"}),
    RemovedKey = Table.RemoveColumns(Expanded, {"ProductUpper"})
in
    RemovedKey`]],
check:'Before the fix: Left Outer = 27 rows with 1 null Category; Inner = 26 rows. After the fix both give 27 rows, all with a Category.',
note:'Fixing it after the merge, e.g. by filling the null Category by hand, hides the root cause, and the next new product will fail silently. If Power BI asks for privacy levels when you merge two files, set both to Organizational (File → Options and settings → Data source settings → Edit permissions).'},

'b-pq-3':{
s:['View ribbon → tick Column quality, Column distribution, Column profile.','Click the text "Column profiling based on top 1000 rows" in the status bar → Entire data set.','Select the Qty column and read the three panels.'],
check:'On the cleaned query, Qty: 24 valid (89%), 0 errors, 3 empty (11%). 7 distinct non-null values (1, 2, 3, 4, 5, 12, -1), and 3 of them are unique (4, 12, -1, each appearing once). Power Query may count the empty value as an 8th distinct value.',
note:'Profiling the raw query (before cleaning) shows errors instead of empties. Profile the step you actually load.'},

'b-model-0':{
s:['Load the five CSVs. Model view → select every relationship line → Delete.','Drag DimProduct[ProductKey] onto FactSales[ProductKey], and do the same for CustomerKey and RegionKey. Drag DimDate[Date] onto FactSales[OrderDate].','Double-click each line: Cardinality = Many to one (*:1), Cross filter direction = Single.','Select DimDate → Table tools → Mark as date table → Date column = Date.','In FactSales, select the four key columns and OrderDate → Properties → Is hidden = On.'],
code:[['DAX','Row count check measure','Order Lines = COUNTROWS ( FactSales )']],
check:'Four relationships, all arrows pointing at FactSales. Card shows 100.',
note:'If a relationship won\'t create, check that both columns have the same data type (Date vs Date/Time, or Text vs Whole Number).'},

'b-model-1':{
s:['Modeling → New table, paste the DAX below.','Select MonthName → Column tools → Sort by column → MonthNumber.','Table tools → Mark as date table → Date. Relate Dates[Date] → FactSales[OrderDate], then delete DimDate.'],
code:[['DAX','Dates table',
`Dates =
ADDCOLUMNS (
    CALENDAR ( DATE ( 2025, 1, 1 ), DATE ( 2026, 12, 31 ) ),
    "Year", YEAR ( [Date] ),
    "MonthNumber", MONTH ( [Date] ),
    "MonthName", FORMAT ( [Date], "mmm" ),
    "YearMonth", YEAR ( [Date] ) & "-" & FORMAT ( MONTH ( [Date] ), "00" ),
    "Quarter", "Q" & QUARTER ( [Date] ),
    "IsWeekend", WEEKDAY ( [Date], 2 ) > 5
)`]],
check:'730 rows. Quantity by month: Jan 141, Feb 120, Mar 72, shown in that order.',
note:'Without Sort by column the axis goes Feb, Jan, Mar (alphabetical).'},

'b-model-2':{
s:['Create DimRegion → FactSales[RegionKey] (active) and DimRegion → DimCustomer[RegionKey]. The second one becomes dashed (inactive), because two active paths from DimRegion to FactSales would be ambiguous.','Swap which one is active (double-click → Make this relationship active) and compare the table.','Keep FactSales[RegionKey] active: it is where the sale happened (the rep\'s region).'],
check:'Quantity by sales region: West 99, Central 98, East 76, South 60. By the customer\'s home region: South 109, West 105, East 96, Central 23. The totals are equal (333); only the split changes.',
note:'The text above says 12 lines differ. In this dataset 79 of the 100 lines have a sales region different from the customer\'s home region, because FactSales[RegionKey] comes from the rep, not the customer.'},

'b-model-3':{
code:[['DAX','Shipped quantity through the inactive relationship',
`Shipped Qty =
CALCULATE (
    SUM ( FactSales[Quantity] ),
    USERELATIONSHIP ( Dates[Date], FactSales[ShipDate] )
)`]],
check:'Ordered vs shipped: Jan 141 / 114, Feb 120 / 147, Mar 72 / 69. Because Dates now runs to Dec 2026, an Apr row appears with 3 shipped units and no orders.',
note:'USERELATIONSHIP only works if the relationship already exists (inactive). It can\'t create one.'},

'b-dax-0':{
s:['Home → Enter Data → name the table _Measures, one column, Load. Create the first measure on it, then delete the dummy column: the table moves to the top of the field list.','Create each measure with New measure, then set the format in Measure tools.'],
code:[['DAX','Core measure set',
`Total Qty = SUM ( FactSales[Quantity] )

Gross Sales = SUMX ( FactSales, FactSales[Quantity] * FactSales[UnitPrice] )

Discount Amt = SUMX ( FactSales, FactSales[Quantity] * FactSales[UnitPrice] * FactSales[Discount] )

Net Sales = [Gross Sales] - [Discount Amt]

COGS = SUMX ( FactSales, FactSales[Quantity] * RELATED ( DimProduct[UnitCost] ) )

Margin % = DIVIDE ( [Net Sales] - [COGS], [Net Sales] )`]],
check:'Total Qty 333 · Gross Sales $36,070.67 · Discount Amt $2,679.54 · Net Sales $33,391.13 · COGS $14,268.50 · Margin % 57.3%.',
note:'RELATED only works from the many side (FactSales) to the one side (DimProduct), and only if the relationship exists.'},

'b-dax-1':{
code:[['DAX','Counting measures',
`Order Lines = COUNTROWS ( FactSales )

Orders = DISTINCTCOUNT ( FactSales[OrderID] )

Customers Buying = DISTINCTCOUNT ( FactSales[CustomerKey] )

Avg Order Value = DIVIDE ( [Net Sales], [Orders] )`]],
check:'Order Lines 100 · Orders 54 · Customers Buying 26 · Avg Order Value $618.35. Orders by Category: Hiking 25, Camping 24, Water 21, Apparel 19 (sum 89 > 54).',
note:'In this dataset the channel is stored per line, so one order can span channels too: Orders by Channel sums to 77 (Online 30, Store 30, Wholesale 17), not 54. That is the same lesson. A distinct count never adds up across rows.'},

'b-dax-2':{
code:[['DAX','First CALCULATE and % of total',
`Camping Sales = CALCULATE ( [Net Sales], DimProduct[Category] = "Camping" )

Sales All Categories = CALCULATE ( [Net Sales], REMOVEFILTERS ( DimProduct[Category] ) )

% of Total = DIVIDE ( [Net Sales], [Sales All Categories] )`]],
check:'Camping Sales shows $6,936.23 on every row: the filter argument replaces the row\'s Category filter. % of Total with no slicer: Water 38.7%, Hiking 26.6%, Camping 20.8%, Apparel 14.0%.',
note:'REMOVEFILTERS(DimProduct[Category]) only removes the Category filter. The Region slicer still applies, which is why each region\'s percentages still sum to 100%.'},

'b-dax-3':{
code:[['DAX','Calculated columns',
`-- on FactSales
Line Type = IF ( FactSales[Quantity] < 0, "Return", "Sale" )

-- on DimCustomer
Tenure Years = DATEDIFF ( DimCustomer[JoinDate], DATE ( 2026, 3, 31 ), YEAR )

Tenure Band =
SWITCH (
    TRUE (),
    DimCustomer[Tenure Years] >= 3, "3+ yrs",
    DimCustomer[Tenure Years] >= 1, "1–2 yrs",
    "New"
)`]],
check:'Slicer shows Sale / Return. Return lines = 7.',
note:'The expected result above says 6. The dataset actually has 7 lines with negative quantity, so trust your count. Also, DATEDIFF with YEAR counts calendar-year boundaries crossed, not full years. A customer who joined in Dec 2025 already shows 1.'},

'b-viz-0':{
s:['View → Page view / Canvas settings: 16:9. Add a text box title, four cards, a column chart (MonthName, Net Sales), a bar chart (Category, Net Sales, sorted descending), a filled map (State) and a RegionName slicer.','Select the bar chart → Format → Edit interactions → on the month chart choose Highlight, on each card choose None.','Filters pane → Filters on this page → drag Line Type, select Sale.'],
code:[['DAX','Return count that ignores the page filter',
`Return Lines =
CALCULATE (
    COUNTROWS ( FactSales ),
    REMOVEFILTERS ( FactSales[Line Type] ),
    FactSales[Line Type] = "Return"
)`]],
check:'Return Lines = 7 even though the page is filtered to Sale. By sales region, South is behind at $3,634.46 vs West $12,164.13.',
note:'A filled map needs a clear geography: set State\'s Data category to State or Province.'},

'b-viz-1':{
s:['Table visual → Net Sales field dropdown → Conditional formatting → Data bars.','Margin % → Conditional formatting → Background color → Format style: Rules. If value ≥ 0 and < 0.4 → red, ≥ 0.4 and < 0.55 → amber, ≥ 0.55 → green. Use "Number", not "Percent": percent here means the percentile of the range.','Margin % → Icons → Rules with the same thresholds. Then remove the data bars.'],
check:'Discontinued products (DimProduct[Discontinued] = TRUE) appear mostly in the red/amber bands. Add Discontinued to the table to verify.',
note:'Choosing "Percent" in the rules dialog is the classic mistake: it means percent of the min–max range, not the value 40%.'},

'b-viz-2':{
s:['Add three slicers. Date slicer: style Between. LoyaltyTier: style Dropdown, Selection → Multi-select with Ctrl = Off.','View → Sync slicers → with the Category slicer selected, tick Sync and Visible for page 2.','Clear all slicers, then View → Bookmarks → Add → rename "Reset". Tick Data only. Insert a button → Action → Bookmark → Reset. Or use Insert → Buttons → Clear all slicers, which does the same with no bookmark.'],
check:'Choosing Hiking on page 1 filters page 2. The button clears both pages.'},

'b-viz-3':{
s:['Matrix: Rows = Category then SubCategory, Columns = MonthName, Values = Net Sales.','Format → Row headers → Options → Stepped layout Off. Row subtotals On, per row level. Use the "Expand all down one level" icon on the visual header.','Add Margin %. Format → Values → Options → Switch values to rows = On.','Conditional formatting → Net Sales → Background color → set "Apply to" = Values only.'],
check:'Each Category has a subtotal row above its subcategories. Values show Net Sales and Margin % stacked, like a financial statement.'},

'b-service-0':{
s:['Service → Workspaces → New workspace "Northwind Dev" (a trial or Pro licence is needed to share). In Desktop, Publish → select it.','Workspace → semantic model → Settings: Enter Data tables show no refreshable source. That is expected.','Report → Share → type the colleague\'s email → untick "Allow recipients to share" and "Allow recipients to build content".','The colleague finds it under Home → Shared with me. They have no workspace access.'],
check:'The colleague can view and interact but has no Edit, no Save a copy, and doesn\'t see the workspace in their list.'},

'b-service-1':{
s:['Workspace → Create app → name, description, navigation → Content: add the report → Audience: add a group or person → Publish.','Open the app link as the consumer. It has app navigation and no workspace chrome. A direct share opens the report alone.','Change a visual in Desktop → Publish (overwrite) → the workspace updates at once, but app users see the change only after Update app.'],
check:'Before Update app the consumer sees the old visual. After it, the new one.'},

'b-service-2':{
s:['Open the report in the Service → hover a card → pin icon → New dashboard "Northwind KPI". Repeat for all four cards.','On the dashboard → Net Sales tile → … → Manage alerts → + Add alert rule, e.g. above 30,000.','Try adding a slicer: dashboards only accept pinned tiles, text/web/image/video tiles and Q&A.'],
check:'Dashboard can: alerts on card/KPI/gauge tiles, tiles from several reports. Dashboard can\'t: slicers, cross-filtering between tiles.'},

'b-service-3':{
s:['Put the CSV where the Service can reach it without a gateway: OneDrive for Business, SharePoint, or a public URL. This site\'s own files work too: Get Data → Web → the address of data/FactSales.csv on your GitHub Pages site.','Publish → semantic model Settings → Data source credentials → Edit (OAuth2 for OneDrive/SharePoint, Anonymous for a public URL) → Scheduled refresh On → 06:00, your time zone.','Change a value in the file → Refresh now → reopen the report.'],
check:'Refresh history shows Completed and the new value appears without republishing.',
note:'A local path like C:\\… needs a gateway. Browse the OneDrive folder through the SharePoint folder connector rather than a local sync path.'},

/* ================= INTERMEDIATE ================= */
'i-pq-0':{
code:[['M','Unpivot with the target kept as a column',
`let
    Source = SurveyWide,
    Targets = Table.SelectColumns(Source, {"StoreCode", "Target-2026"}),
    WithoutTarget = Table.RemoveColumns(Source, {"Target-2026"}),
    UnpivotedMonths = Table.UnpivotOtherColumns(WithoutTarget, {"StoreCode", "StoreName", "RegionKey"}, "MonthYear", "Score"),
    SplitMonthAndYear = Table.SplitColumn(UnpivotedMonths, "MonthYear", Splitter.SplitTextByDelimiter("-"), {"Month", "Year"}),
    AddedMonthDate = Table.AddColumn(SplitMonthAndYear, "MonthDate",
        each Date.FromText("1 " & [Month] & " " & [Year], [Culture = "en-US"]), type date),
    MergedTarget = Table.NestedJoin(AddedMonthDate, {"StoreCode"}, Targets, {"StoreCode"}, "T", JoinKind.LeftOuter),
    ExpandedTarget = Table.ExpandTableColumn(MergedTarget, "T", {"Target-2026"}, {"Target"}),
    Typed = Table.TransformColumnTypes(ExpandedTarget,
        {{"RegionKey", Int64.Type}, {"Score", type number}, {"Target", type number}})
in
    Typed`]],
check:'36 rows (12 stores × 3 months). Target = 4.5 on every row.',
note:'Unpivoting before removing Target-2026 produces 48 rows, with "Target" posing as a month.'},

'i-pq-1':{
code:[['M','fnCleanMoney',
`(t as nullable text) as nullable number =>
let
    s = Text.Remove(t ?? "", {"$", " ", "U", "S", "D", ","}),
    n = try Number.From(s, "en-US") otherwise null
in
    n`],['M','fnParseDate (culture order decides ambiguous dates)',
`(t as nullable text) as nullable date =>
let
    s = Text.Trim(t ?? "")
in
    if s = "" then null
    else try Date.FromText(s, [Culture = "en-US"])
    otherwise try Date.FromText(s, [Culture = "en-GB"])
    otherwise try Date.FromText(s)
    otherwise null`]],
check:'Zero errors. "N/A" → null. With en-US tried first, 09-01-2026 becomes 1 Sep 2026 and 06/02/2026 becomes 2 Jun 2026, because en-US succeeds before en-GB is ever tried.',
note:'Both of those are wrong for this export: the order sequence puts them on 9 Jan and 6 Feb. A culture list can\'t resolve genuinely ambiguous dates. Only a rule about the source can. Add a check step that flags dates outside Jan–Mar 2026.'},

'i-pq-2':{
code:[['M','Config table and lookup',
`// Query: Config
#table(
    type table [Environment = text, Path = text],
    {
        {"Dev",  "https://contoso-my.sharepoint.com/personal/you/Documents/Dev/FactSales.csv"},
        {"Test", "https://contoso-my.sharepoint.com/personal/you/Documents/Test/FactSales.csv"},
        {"Prod", "https://contoso-my.sharepoint.com/personal/you/Documents/Prod/FactSales.csv"}
    }
)

// First steps of the main query
SourcePath = Table.SelectRows(Config, each [Environment] = Environment){0}[Path],
Source = Csv.Document(Web.Contents(SourcePath), [Delimiter = ",", Encoding = 65001])`]],
check:'Switching Environment and refreshing loads a different file with no code change.',
note:'The Service may refuse scheduled refresh with "dynamic data source" because the URL is computed by a query. If that happens, make the path itself a parameter (with a list of allowed values). The Service treats parameter-driven sources as static.'},

'i-pq-3':{
code:[['M','Approach A: merge on week start',
`let
    Source = FactSales,
    AddedWeekStart = Table.AddColumn(Source, "WeekStart", each Date.StartOfWeek([OrderDate], Day.Monday), type date),
    EurRates = Table.SelectRows(ExchangeRates, each [Currency] = "EUR"),
    Merged = Table.NestedJoin(AddedWeekStart, {"WeekStart"}, EurRates, {"RateDate"}, "Rate", JoinKind.LeftOuter),
    Expanded = Table.ExpandTableColumn(Merged, "Rate", {"RateToUSD"}, {"EURtoUSD"})
in
    Expanded`],['M','Approach B: last rate on or before the date',
`let
    Source = FactSales,
    EurRates = Table.Buffer(Table.SelectRows(ExchangeRates, each [Currency] = "EUR")),
    AddedRate = Table.AddColumn(Source, "EURtoUSD", each
        let
            d = [OrderDate],
            eligible = Table.SelectRows(EurRates, each [RateDate] <= d)
        in
            if Table.IsEmpty(eligible) then null
            else Table.Max(eligible, "RateDate")[RateToUSD], type number),
    AddedNetEUR = Table.AddColumn(AddedRate, "NetSalesEUR",
        each [Quantity] * [UnitPrice] * (1 - [Discount]) / [EURtoUSD], type number)
in
    AddedNetEUR`]],
check:'99 of 100 rows get a rate. The one order dated before 5 Jan 2026 (the first Monday rate) gets null in both approaches. Fall back to the earliest rate if the business agrees.',
note:'RateToUSD is USD per 1 EUR, so USD → EUR means divide, not multiply.'},

'i-pq-4':{
code:[['M','Parameters and the filter step',
`// Parameter queries (Manage Parameters → New, type Date/Time)
RangeStart = #datetime(2026, 1, 1, 0, 0, 0) meta [IsParameterQuery = true, Type = "DateTime", IsParameterQueryRequired = true]
RangeEnd   = #datetime(2026, 4, 1, 0, 0, 0) meta [IsParameterQuery = true, Type = "DateTime", IsParameterQueryRequired = true]

// In FactSales, as early as possible
Filtered = Table.SelectRows(Source, each [OrderDate] >= RangeStart and [OrderDate] < RangeEnd)`]],
check:'Against SQL, right-click Filtered → View Native Query shows a WHERE clause. Against a CSV the option is always greyed out: files never fold.',
note:'Use >= on one end and < on the other, or rows on the boundary load twice. OrderDate must be Date/Time to compare with Date/Time parameters.'},

'i-model-0':{
code:[['DAX','Bridge dimensions and measures',
`DimCategory = DISTINCT ( DimProduct[Category] )

DimMonth = DISTINCT ( Dates[YearMonth] )

Budget = SUM ( FactBudget[BudgetAmount] )

Variance % = DIVIDE ( [Net Sales] - [Budget], [Budget] )`]],
s:['Relationships: DimCategory[Category] 1→* DimProduct[Category] and 1→* FactBudget[Category]. DimMonth[YearMonth] 1→* Dates[YearMonth] and 1→* FactBudget[YearMonth]. DimRegion 1→* FactBudget[RegionKey].','Use DimCategory[Category] and DimMonth[YearMonth] on the matrix, not the columns from DimProduct or Dates, because only the shared dimensions filter both facts.'],
check:'Budget total $112,710 (Jan 38,500 · Feb 35,350 · Mar 38,860). By category: Water 36,320 · Camping 29,940 · Hiking 26,320 · Apparel 20,130.',
note:'Actuals are a 100-line sample, so every cell is far below budget. The point is that both numbers appear in the same cell.'},

'i-model-1':{
code:[['DAX','Bridge on Segment + LoyaltyTier',
`BridgeSegTier =
ADDCOLUMNS (
    SUMMARIZE ( DimCustomer, DimCustomer[Segment], DimCustomer[LoyaltyTier] ),
    "SegTierKey", DimCustomer[Segment] & "|" & DimCustomer[LoyaltyTier]
)

-- calculated column on DimCustomer and on CustomerTargets
SegTierKey = DimCustomer[Segment] & "|" & DimCustomer[LoyaltyTier]`]],
s:['Relate BridgeSegTier[SegTierKey] 1→* DimCustomer[SegTierKey] (cross filter: Both) and 1→* CustomerTargets[SegTierKey] (Single).','Filter CustomerTargets[Quarter] = 2026-Q1, or targets for two quarters get added together.'],
check:'Per Segment × Tier row, Net Sales and TargetRevenue appear side by side. The *:* version gives the same row values.',
note:'If Power BI reports a circular dependency, build the bridge in Power Query instead: Reference DimCustomer → keep Segment and LoyaltyTier → Remove Duplicates → add the key column. Also check CustomerTargets for combinations with no customers: a bridge built only from DimCustomer drops their targets.'},

'i-model-2':{
code:[['DAX','Flatten the hierarchy and roll sales up',
`Path = PATH ( DimEmployee[EmployeeKey], DimEmployee[ManagerKey] )

Level1 = LOOKUPVALUE ( DimEmployee[EmployeeName], DimEmployee[EmployeeKey], PATHITEM ( DimEmployee[Path], 1, INTEGER ) )
Level2 = LOOKUPVALUE ( DimEmployee[EmployeeName], DimEmployee[EmployeeKey], PATHITEM ( DimEmployee[Path], 2, INTEGER ) )
Level3 = LOOKUPVALUE ( DimEmployee[EmployeeName], DimEmployee[EmployeeKey], PATHITEM ( DimEmployee[Path], 3, INTEGER ) )
Level4 = LOOKUPVALUE ( DimEmployee[EmployeeName], DimEmployee[EmployeeKey], PATHITEM ( DimEmployee[Path], 4, INTEGER ) )

Team Sales =
VAR Boss = SELECTEDVALUE ( DimEmployee[EmployeeKey] )
RETURN
    CALCULATE (
        [Net Sales],
        FILTER ( ALL ( DimEmployee ), PATHCONTAINS ( DimEmployee[Path], Boss ) )
    )`]],
check:'Grace Hollis = $33,391.13 (grand total). Dana Whitfield = $12,164.13 (West: Rosa, Ken, Lily, Jonah and Dana). Nina Kowalski = blank.',
note:'FactSales[EmployeeKey] must be related to DimEmployee[EmployeeKey]. Shorter branches leave Level3/Level4 blank, which gives a ragged hierarchy. Hide the blank members or fill them with the parent\'s name.'},

'i-model-3':{
check:'Sum of QuantityOnHand = 5,791, which is 10 weekly snapshots added together. The real stock is the last snapshot: 682 units on 8 Mar 2026.',
s:['Suggested sentence: "Stock is a snapshot, so across time we must take the last snapshot date in the period, not the sum."']},

'i-dax-0':{
code:[['DAX','Every modifier side by side',
`-- keeps every filter
Net Sales

-- ignores all filters on DimProduct, including the visual-level filter
Sales ALL Product = CALCULATE ( [Net Sales], ALL ( DimProduct ) )

-- ignores the row's product filter but respects slicers and visual filters
Sales ALLSELECTED Product = CALCULATE ( [Net Sales], ALLSELECTED ( DimProduct ) )

-- removes DimProduct filters except Category
Sales ALLEXCEPT Category = CALCULATE ( [Net Sales], ALLEXCEPT ( DimProduct, DimProduct[Category] ) )

-- removes every filter in the model, including the Region slicer
Sales No Filters = CALCULATE ( [Net Sales], REMOVEFILTERS () )

-- intersects with the current filter instead of replacing it
Water Only Keep = CALCULATE ( [Net Sales], KEEPFILTERS ( DimProduct[Category] = "Water" ) )`]],
check:'Sales No Filters = $33,391.13 on every row regardless of the West slicer. Water Only Keep is blank on non-Water rows. With Category ≠ Apparel, ALL still includes Apparel in its number and ALLSELECTED doesn\'t.'},

'i-dax-1':{
code:[['DAX','Time intelligence set',
`Sales MTD = TOTALMTD ( [Net Sales], Dates[Date] )

Sales QTD = TOTALQTD ( [Net Sales], Dates[Date] )

Sales PM = CALCULATE ( [Net Sales], DATEADD ( Dates[Date], -1, MONTH ) )

MoM % = DIVIDE ( [Net Sales] - [Sales PM], [Sales PM] )

Sales Rolling 30 =
CALCULATE (
    [Net Sales],
    DATESINPERIOD ( Dates[Date], MAX ( Dates[Date] ), -30, DAY )
)`]],
check:'Net Sales Jan $11,573.97 · Feb $10,327.81 · Mar $11,489.35. MoM %: Jan blank, Feb −10.8%, Mar +11.2%.'},

'i-dax-2':{
code:[['DAX','Iterators',
`Avg Sales per Customer = AVERAGEX ( VALUES ( DimCustomer[CustomerKey] ), [Net Sales] )

Best Product Sales = MAXX ( VALUES ( DimProduct[ProductName] ), [Net Sales] )

Best Product =
MAXX (
    TOPN ( 1, VALUES ( DimProduct[ProductName] ), [Net Sales] ),
    DimProduct[ProductName]
)

Customer Rank = RANKX ( ALLSELECTED ( DimCustomer[CustomerName] ), [Net Sales], , DESC, DENSE )

Customers Over 500 = COUNTROWS ( FILTER ( VALUES ( DimCustomer[CustomerKey] ), [Net Sales] > 500 ) )`]],
check:'Avg Sales per Customer = $1,284.27 (both versions agree at the total). Best Product = Drift Paddle Board ($6,659.89). Rank 1 = Lena Moore ($4,464.57). Customers Over 500 = 19.',
note:'TOPN can return several rows on a tie. MAXX then returns the alphabetically last name, which is why it is wrapped.'},

'i-dax-3':{
code:[['DAX','Variables and a text measure',
`MoM % =
VAR cur = [Net Sales]
VAR prev = [Sales PM]
VAR delta = cur - prev
RETURN
    DIVIDE ( delta, prev )      -- temporarily: RETURN prev

Sales Summary = "Net " & FORMAT ( [Net Sales], "$#,##0" ) & " across " & [Orders] & " orders"`],['DAX','DAX Studio query',
`EVALUATE
SUMMARIZECOLUMNS (
    DimProduct[Category],
    "Sales", [Net Sales]
)`]],
check:'Card reads "Net $33,391 across 54 orders". In DAX Studio: Home → Server Timings on → Run → read the Total, FE and SE ms on the Server Timings tab.'},

'i-dax-4':{
code:[['DAX','Budget variance',
`Budget = SUM ( FactBudget[BudgetAmount] )

Variance = [Net Sales] - [Budget]

Variance % = DIVIDE ( [Variance], [Budget] )

Attainment Status =
SWITCH (
    TRUE (),
    ISBLANK ( [Budget] ), "No budget",
    [Variance %] >= 0, "On target",
    [Variance %] >= -0.1, "Watch",
    "Behind"
)

Attainment Colour =
SWITCH ( [Attainment Status], "On target", "#1F7A4D", "Watch", "#B7791F", "Behind", "#B23A2E", "#7A8594" )`]],
s:['Matrix → Net Sales → Conditional formatting → Font colour → Format style: Field value → Attainment Colour.'],
check:'Product rows show "No budget". In this sample every category shows "Behind", because 100 lines of actuals sit against a full budget ($112,710).'},

'i-viz-0':{
s:['New page "Customer Detail". In the Visualizations pane → Drill through → add CustomerName. Keep all filters = On.','Power BI adds a back button automatically. Style it with Format → Button.','On the summary page, right-click a customer bar → Drill through → Customer Detail.'],
check:'The detail page shows that customer only, and the Region slicer selection carries over. Once you add ProductName as a second drillthrough field, either field can trigger the page.'},

'i-viz-1':{
s:['New page → Format page → Page information → Allow use as tooltip = On. Canvas settings → Type: Tooltip.','Add a Net Sales card, a SubCategory bar chart and a card with the measure below.','Summary page → Category bar chart → Format → General → Tooltips → Type: Report page → Page: your tooltip page.'],
code:[['DAX','Tooltip text measure','Tooltip Text = [Orders] & " orders, " & [Customers Buying] & " customers"']],
check:'Hovering Water shows Water numbers only ($12,924.07 net).'},

'i-viz-2':{
s:['Modeling → New parameter → Fields → add Net Sales, Orders, Margin %, Total Qty → name "Measure Picker" → Add slicer.','Again for "Axis Picker" with Category, RegionName, Segment, MonthName.','Clustered bar chart: Y-axis = Axis Picker, X-axis = Measure Picker.'],
code:[['DAX','What Power BI generates',
`Measure Picker = {
    ("Net Sales", NAMEOF ( '_Measures'[Net Sales] ), 0),
    ("Orders", NAMEOF ( '_Measures'[Orders] ), 1),
    ("Margin %", NAMEOF ( '_Measures'[Margin %] ), 2),
    ("Total Qty", NAMEOF ( '_Measures'[Total Qty] ), 3)
}`]],
check:'4 measures × 4 axes = 16 combinations. The third column is the sort order of the choices in the slicer.'},

'i-viz-3':{
s:['Place the chart and the table at identical positions and sizes (Format → General → Properties).','View → Selection pane: hide the table → Bookmarks → Add "Show chart". Hide the chart, show the table → Add "Show table". Right-click each bookmark → untick Data and Current page, keep Display.','Add two buttons. In each bookmark, show the "pressed" style button and hide the other. Link each button → Action → Bookmark.','Group the four objects (Ctrl-click in Selection pane → Group).'],
check:'Changing a slicer and then toggling keeps the slicer, because Data is unticked. Grouping or ungrouping can break bookmarks that captured the old structure: update them afterwards.'},

'i-viz-4':{
code:[['DAX','Dynamic title and colour',
`Title =
"Net sales for "
    & IF (
        ISFILTERED ( DimRegion[RegionName] ),
        SELECTEDVALUE ( DimRegion[RegionName], "multiple regions" ),
        "all regions"
    )
    & " – " & FORMAT ( MAX ( Dates[Date] ), "MMM yyyy" )

Bar Colour = IF ( [Margin %] < 0.4, "#B23A2E", "#1F7A4D" )`]],
s:['Chart → Format → Title → fx → Field value → Title.','Columns/Bars → Colour → fx → Format style: Field value → Bar Colour.'],
check:'Choose West: "Net sales for West – Dec 2026". MAX(Dates[Date]) returns the last date in the Dates table, so use MAX(FactSales[OrderDate]) if you want "Mar 2026".'},

'i-rls-0':{
code:[['DAX','Role table filter (on DimRegion)','[RegionName] = "West"']],
s:['Modeling → Manage roles → New → table DimRegion → switch to the DAX editor → paste the filter. Repeat for South, East, Central.','Modeling → View as → tick West.','Service → semantic model → … → Security → West → add the test user.'],
check:'Cards show West only: $12,164.13 net sales.',
note:'RLS doesn\'t apply to workspace Admins, Members or Contributors. Test with a Viewer or an app user.'},

'i-rls-1':{
code:[['DAX','Role "Dynamic": table filter on DimRegion',
`VAR u = USERPRINCIPALNAME ()
VAR IsAll =
    NOT ISEMPTY (
        FILTER (
            UserRegionMapping,
            UserRegionMapping[UserEmail] = u
                && UserRegionMapping[AccessLevel] = "All"
        )
    )
RETURN
    IsAll
        || CONTAINS (
            UserRegionMapping,
            UserRegionMapping[UserEmail], u,
            UserRegionMapping[RegionKey], DimRegion[RegionKey]
        )`]],
s:['With the filter on DimRegion, you don\'t need a filter on UserRegionMapping or a bi-directional relationship. Hide UserRegionMapping from report view.','View as → tick "Other user" (enter the email) and tick the role "Dynamic".'],
check:'nina.kowalski@ → West and East. grace.hollis@ → all four (AccessLevel "All", RegionKey 0). dana.whitfield@ → West.'},

'i-rls-2':{
code:[['DAX','Role "MyTeam": table filter on DimEmployee',
`PATHCONTAINS (
    DimEmployee[Path],
    LOOKUPVALUE ( DimEmployee[EmployeeKey], DimEmployee[Email], USERPRINCIPALNAME () )
)`]],
check:'dana.whitfield@ → 5 employees (Dana, Rosa Delgado, Ken Osei, Lily Chang, Jonah Pike), $12,164.13. lily.chang@ → only herself, $1,967.55.'},

'i-rls-3':{
s:['As the restricted user: Analyze in Excel → PivotTable shows only their regions. New report on the model (needs Build) → same.','Measure: CALCULATE([Net Sales], ALL(DimRegion)) still returns only the permitted total.','Publish the same PBIX to another workspace → Security page is empty there.'],
check:'RLS filters are applied before any DAX runs, so ALL() can\'t lift them. Role membership is stored per semantic model in the Service, not in the PBIX.'},

'i-service-0':{
s:['Download the on-premises data gateway (standard mode) → sign in → Register a new gateway → name it and store the recovery key safely.','Service → Settings → Manage connections and gateways → New → On-premises → your gateway → File (path + Windows credentials) or SQL Server.','Semantic model → Settings → Gateway and cloud connections → map the source → Scheduled refresh.','services.msc → stop "On-premises data gateway service" → Refresh now → read the error. Start it again.','Gateway → Manage users → add a second Admin.'],
check:'Online: Completed. Offline: an error saying the gateway is unreachable or offline.',
note:'The account running the gateway service needs read access to the file path. Use a UNC path (\\\\server\\share), not a mapped drive letter.'},

'i-service-1':{
s:['Create Northwind-Dev, -Test, -Prod and Northwind-Models. Publish the full PBIX to Northwind-Models.','Desktop → new file → Get Data → Power BI semantic models → pick the model → build visuals → Publish to Northwind-Dev.','Model → Manage permissions → Add user → tick "Allow recipients to build content".'],
check:'Lineage view shows one model feeding reports in two workspaces. Deleting a report leaves the model untouched.'},

'i-service-2':{
s:['Semantic model → Settings → Refresh history → download the log (or read Details).','Scheduled refresh → "Send refresh failure notifications to" → add the colleague.','Add 8 time slots. Adding a 9th on Pro is blocked.'],
check:'Pro: 8 scheduled refreshes per day. Premium Per User / Fabric or Premium capacity: 48 per day.'},

'i-service-3':{
s:['Workspace → Create app / Update app → Audience tab → New audience "Managers" (all content) and "Reps" (hide the manager page).','Navigation → New → Link → an external URL.','Update a visual → republish → Update app.'],
check:'A Rep opening the manager page by URL is refused. Changes reach app users only after Update app.'},

/* ================= ADVANCED ================= */
'a-perf-0':{
code:[['M','FactSalesBig: 100,000 deterministic rows',
`let
    Source = FactSales,
    Copies = Table.FromList(List.Numbers(1, 1000), Splitter.SplitByNothing(), {"Copy"}),
    CrossJoined = Table.ExpandTableColumn(Table.AddColumn(Source, "C", each Copies), "C", {"Copy"}),
    // deterministic "random" shift of 0–364 days keeps dates inside the Dates table
    AddedOffset = Table.AddColumn(CrossJoined, "DayOffset", each Number.Mod([Copy] * 37 + [SalesKey] * 11, 365), Int64.Type),
    NewOrderDate = Table.AddColumn(AddedOffset, "OrderDate2", each Date.AddDays([OrderDate], -[DayOffset]), type date),
    NewShipDate = Table.AddColumn(NewOrderDate, "ShipDate2", each Date.AddDays([ShipDate], -[DayOffset]), type date),
    NewOrderID = Table.AddColumn(NewShipDate, "OrderID2", each [OrderID] & "-" & Text.From([Copy]), type text),
    Dropped = Table.RemoveColumns(NewOrderID, {"OrderDate", "ShipDate", "OrderID", "DayOffset", "Copy", "SalesKey"}),
    Renamed = Table.RenameColumns(Dropped, {{"OrderDate2", "OrderDate"}, {"ShipDate2", "ShipDate"}, {"OrderID2", "OrderID"}}),
    AddedKey = Table.AddIndexColumn(Renamed, "SalesKey", 1, 1, Int64.Type)
in
    AddedKey`]],
s:['DAX Studio → connect to the open PBIX → Advanced → View Metrics. Record the Tables and Columns tabs (Total Size).','Remove SalesKey (it is unique per row), change UnitPrice to Fixed decimal number, keep dates as Date, not Date/Time. Refresh and record again.'],
check:'100,000 rows. Before the change, SalesKey (100,000 distinct values) and OrderID are the largest columns. Removing SalesKey gives the biggest saving.'},

'a-perf-1':{
code:[['DAX','Three versions',
`-- create first, on FactSalesBig
Net Sales Big = SUMX ( FactSalesBig, FactSalesBig[Quantity] * FactSalesBig[UnitPrice] * ( 1 - FactSalesBig[Discount] ) )

-- 1: iterates every fact row and calls the measure per row (context transition each time)
Customers Over 500 Slow = COUNTROWS ( FILTER ( FactSalesBig, [Net Sales Big] > 500 ) )

-- 2: iterates customers only
Customers Over 500 = COUNTROWS ( FILTER ( VALUES ( DimCustomer[CustomerKey] ), [Net Sales Big] > 500 ) )

-- 3: iterates the distinct customer keys present in the fact
Customers Over 500 v3 = COUNTROWS ( FILTER ( SUMMARIZE ( FactSalesBig, FactSalesBig[CustomerKey] ), [Net Sales Big] > 500 ) )`],['DAX','Query to time in DAX Studio',
`EVALUATE
SUMMARIZECOLUMNS (
    DimRegion[RegionName],
    "Slow", [Customers Over 500 Slow],
    "Fast", [Customers Over 500]
)`]],
check:'Version 1 shows far more storage engine queries and/or CallbackDataID. Version 2 is a handful of SE queries.',
note:'Version 1 is not only slow, it answers a different question: it counts fact rows over 500, not customers. Fast and wrong is still wrong, so always check the number first.'},

'a-perf-2':{
code:[['M','AggSalesMonthCat',
`let
    Source = FactSalesBig,
    AddedYearMonth = Table.AddColumn(Source, "YearMonth", each Date.ToText([OrderDate], [Format = "yyyy-MM"]), type text),
    MergedProduct = Table.NestedJoin(AddedYearMonth, {"ProductKey"}, DimProduct, {"ProductKey"}, "P", JoinKind.LeftOuter),
    ExpandedCategory = Table.ExpandTableColumn(MergedProduct, "P", {"Category"}),
    AddedAmount = Table.AddColumn(ExpandedCategory, "Amount", each [Quantity] * [UnitPrice] * (1 - [Discount]), type number),
    Grouped = Table.Group(AddedAmount, {"YearMonth", "Category", "RegionKey"}, {
        {"SumQuantity", each List.Sum([Quantity]), type number},
        {"SumAmount", each List.Sum([Amount]), type number},
        {"CountRows", each Table.RowCount(_), Int64.Type}})
in
    Grouped`]],
s:['Model view → AggSalesMonthCat → Manage aggregations: SumQuantity → Sum of FactSalesBig[Quantity], CountRows → Count table rows of FactSalesBig, Category → GroupBy DimProduct[Category], RegionKey → GroupBy FactSalesBig[RegionKey], YearMonth → GroupBy Dates[YearMonth].','SumAmount can only map to a physical column. Add an Amount column to FactSalesBig so the mapping has a detail column.','DAX Studio → All Queries/Query Plan with "Aggregate Rewrite Attempt" events visible.'],
check:'A query by Category shows a successful match. A query by ProductName shows a miss and goes to the detail table.',
note:'Aggregations only kick in automatically when the detail table is DirectQuery. With everything in Import you are only practising the mapping.'},

'a-perf-3':{
s:['Filter step: OrderDate >= RangeStart and < RangeEnd, and confirm it folds (View Native Query).','Table → Incremental refresh: Archive 2 years, Incrementally refresh 3 days, optionally Detect data changes (ModifiedDate) and Only refresh complete days.','Publish → Refresh once. SSMS → connect to powerbi://api.powerbi.com/v1.0/myorg/<workspace> → table → Partitions.','Insert a row dated 10 days ago → refresh → it doesn\'t appear. Widen the incremental window → refresh → it appears.'],
check:'Partitions: whole years for old data, then quarters, months, and days for the most recent period.',
note:'The first refresh after publishing loads the whole archive. Plan it outside business hours.'},

'a-perf-4':{
code:[['DAX','Two ways to compute session length',
`Sessions = DISTINCTCOUNT ( WebEvents[SessionID] )

Sessions With Purchase = CALCULATE ( [Sessions], WebEvents[EventType] = "Purchase" )

Conversion Rate = DIVIDE ( [Sessions With Purchase], [Sessions] )

-- (a) all at query time
Avg Session Minutes =
AVERAGEX (
    VALUES ( WebEvents[SessionID] ),
    DATEDIFF ( CALCULATE ( MIN ( WebEvents[EventTime] ) ), CALCULATE ( MAX ( WebEvents[EventTime] ) ), MINUTE )
)

-- (b) pay at refresh: calculated columns
SessionStart = MINX ( FILTER ( WebEvents, WebEvents[SessionID] = EARLIER ( WebEvents[SessionID] ) ), WebEvents[EventTime] )
SessionEnd   = MAXX ( FILTER ( WebEvents, WebEvents[SessionID] = EARLIER ( WebEvents[SessionID] ) ), WebEvents[EventTime] )

Avg Session Minutes (col) =
AVERAGEX ( VALUES ( WebEvents[SessionID] ), DATEDIFF ( MIN ( WebEvents[SessionStart] ), MIN ( WebEvents[SessionEnd] ), MINUTE ) )`]],
check:'Sessions 39 · Sessions With Purchase 6 · Conversion Rate 15.4% · Avg Session Minutes 8.18.',
note:'In (b), CALCULATE(MIN(...), ALLEXCEPT(WebEvents, WebEvents[SessionID])) is a clearer modern alternative to EARLIER.'},

'a-dax-0':{
code:[['DAX','Semi-additive stock',
`Stock On Hand =
CALCULATE (
    SUM ( FactInventory[QuantityOnHand] ),
    LASTNONBLANK ( Dates[Date], CALCULATE ( SUM ( FactInventory[QuantityOnHand] ) ) )
)

Below Reorder =
COUNTROWS (
    FILTER (
        VALUES ( DimProduct[ProductKey] ),
        [Stock On Hand] < CALCULATE ( MAX ( FactInventory[ReorderPoint] ) )
    )
)`]],
check:'Stock On Hand: Jan 725 (snapshot 25 Jan), Feb 516 (22 Feb), Mar 682 (8 Mar). The plain sum would be 5,791. Below Reorder at month end: Jan 1 (Hydro Filter Bottle, 21 vs 30), Feb 1 (Ridge Runner Boots, 1 vs 30), Mar 0.',
note:'FactInventory[SnapshotDate] must be related to Dates[Date]. The kayak and board (reorder point 5) never finish a month below 5 in this data. The alerts come from products with a reorder point of 30.'},

'a-dax-1':{
code:[['DAX','Calculation items of "Time Calc"',
`-- Current
SELECTEDMEASURE ()

-- PM
CALCULATE ( SELECTEDMEASURE (), DATEADD ( Dates[Date], -1, MONTH ) )

-- MoM %   (Format string expression: "0.0%")
VAR cur = SELECTEDMEASURE ()
VAR prev = CALCULATE ( SELECTEDMEASURE (), DATEADD ( Dates[Date], -1, MONTH ) )
RETURN DIVIDE ( cur - prev, prev )

-- MTD
CALCULATE ( SELECTEDMEASURE (), DATESMTD ( Dates[Date] ) )

-- Format string expression for Current, PM, MTD
SELECTEDMEASUREFORMATSTRING ()`]],
s:['Tabular Editor 2 (External tools) → right-click Tables → Create New → Calculation Group. Or, in recent Desktop versions, Model view → Calculation group.','Add the items above in the order Current, PM, MoM %, MTD (Ordinal 0–3). Ctrl+S saves back to Desktop → Refresh now.'],
check:'Matrix: Category × Time Calc with Net Sales, then Orders. MoM % shows a %, the others keep $ or whole-number formats.',
note:'Creating a calculation group turns on "Discourage implicit measures". Dragged-in columns stop summing, so use explicit measures only.'},

'a-dax-2':{
code:[['DAX','Currency table (disconnected) and the "Selected" calculation item',
`Currency = DATATABLE ( "Code", STRING, { { "USD" }, { "EUR" }, { "GBP" }, { "CAD" } } )

-- Calculation group "Currency", item "Selected"
VAR c = SELECTEDVALUE ( Currency[Code], "USD" )
RETURN
    IF (
        c = "USD" || NOT ISSELECTEDMEASURE ( [Net Sales], [Gross Sales], [COGS] ),
        SELECTEDMEASURE (),
        SUMX (
            VALUES ( Dates[Date] ),
            VAR d = Dates[Date]
            VAR rateDate =
                COALESCE (
                    CALCULATE ( MAX ( ExchangeRates[RateDate] ), REMOVEFILTERS ( Dates ), ExchangeRates[Currency] = c, ExchangeRates[RateDate] <= d ),
                    CALCULATE ( MIN ( ExchangeRates[RateDate] ), REMOVEFILTERS ( Dates ), ExchangeRates[Currency] = c )
                )
            VAR r = CALCULATE ( MAX ( ExchangeRates[RateToUSD] ), REMOVEFILTERS ( Dates ), ExchangeRates[Currency] = c, ExchangeRates[RateDate] = rateDate )
            RETURN DIVIDE ( CALCULATE ( SELECTEDMEASURE () ), r )
        )
    )`]],
check:'January Net Sales in EUR, converted per day = €10,905.83. Converting the January total ($11,573.97) once at the last January rate = €10,957.09. Per-day conversion is correct: each sale is converted at the rate that applied when it happened.',
note:'The rate logic is written inline instead of calling a [Rate] measure. A measure referenced inside a calculation item gets the calculation item applied to it too (sideways recursion). ISSELECTEDMEASURE stops Orders or Margin % from being "converted".'},

'a-dax-3':{
code:[['DAX','Virtual relationship and CROSSFILTER',
`Budget via TREATAS =
CALCULATE (
    SUM ( FactBudget[BudgetAmount] ),
    TREATAS ( VALUES ( DimProduct[Category] ), FactBudget[Category] ),
    TREATAS ( VALUES ( Dates[YearMonth] ), FactBudget[YearMonth] )
)

-- count customers who bought the products in the current filter
Customers Buying Selected =
CALCULATE (
    DISTINCTCOUNT ( DimCustomer[CustomerKey] ),
    CROSSFILTER ( FactSales[CustomerKey], DimCustomer[CustomerKey], BOTH )
)`]],
check:'Budget via TREATAS = $112,710 at the total and equals the relationship-based Budget in every Category × Month cell.'},

'a-dax-4':{
code:[['DAX','ABC classification, running total, previous row, rank',
`Customer ABC Class =
VAR t = ADDCOLUMNS ( ALLSELECTED ( DimCustomer[CustomerKey] ), "@s", [Net Sales] )
VAR total = SUMX ( t, [@s] )
VAR cur = [Net Sales]
VAR cum = SUMX ( FILTER ( t, [@s] >= cur ), [@s] )
RETURN
    SWITCH ( TRUE (), DIVIDE ( cum, total ) <= 0.7, "A", DIVIDE ( cum, total ) <= 0.9, "B", "C" )

Running Sales =
CALCULATE (
    [Net Sales],
    WINDOW ( 1, ABS, 0, REL, ALLSELECTED ( DimCustomer[CustomerName] ), ORDERBY ( [Net Sales], DESC ) )
)

Prev Customer Sales =
CALCULATE (
    [Net Sales],
    OFFSET ( -1, ALLSELECTED ( DimCustomer[CustomerName] ), ORDERBY ( [Net Sales], DESC ) )
)

Customer Position = RANK ( DENSE, ALLSELECTED ( DimCustomer[CustomerName] ), ORDERBY ( [Net Sales], DESC ) )`]],
check:'26 buying customers: 7 A, 8 B, 11 C. Running Sales on the last row = $33,391.13.',
note:'Customers with no sales still appear in the table, because Running Sales isn\'t blank for them. Wrap the measure in IF ( NOT ISBLANK ( [Net Sales] ), … ) to hide them. Older Power BI versions may reject a measure inside ORDERBY: add it as a column first (ADDCOLUMNS(..., "@s", [Net Sales])) and order by [@s]. WINDOW locates the current row inside the relation you pass. A FILTER that can remove the current row leaves WINDOW with nothing to anchor on, so filter the result, not the relation.'},

'a-composite-0':{
s:['Load FactSalesBig to SQL (SQL Server Express + Import Flat File wizard, or a Fabric Warehouse). Get Data → SQL Server → DirectQuery. Import the dimensions (set them to Dual later).','Performance Analyzer → Start recording → Refresh visuals → expand a visual → Copy query. For the SQL, use DAX Studio\'s "Server Timings" or SQL Profiler / Query Store on the source.','Relationship → Assume referential integrity = On.'],
code:[['SQL','What changes with Assume referential integrity (simplified)',
`-- Off (default): keeps fact rows with unknown keys
SELECT d.Category, SUM(f.Quantity)
FROM FactSalesBig f
LEFT OUTER JOIN DimProduct d ON f.ProductKey = d.ProductKey
GROUP BY d.Category;

-- On: Power BI trusts every key matches and uses a faster join
SELECT d.Category, SUM(f.Quantity)
FROM FactSalesBig f
INNER JOIN DimProduct d ON f.ProductKey = d.ProductKey
GROUP BY d.Category;`]],
check:'You have the before/after SQL and can explain that INNER JOIN silently drops rows with unknown keys if the promise is false.'},

'a-composite-1':{
s:['Desktop → Get Data → Power BI semantic models → Northwind → status bar "Make changes to this model" → Add a local model.','Get Data → Excel → your targets → relate to the remote DimRegion (the relationship shows limited-relationship brackets).','Delete a column in the source model, republish it, refresh the composite report.'],
code:[['DAX','Measure mixing remote and local tables','Target Attainment = DIVIDE ( [Net Sales], SUM ( RegionTargets[Target] ) )']],
check:'The error names the missing column. Changes to the upstream model can break every composite built on it, so treat shared models as contracts.'},

'a-composite-2':{
s:['Table (DirectQuery source) → Incremental refresh → tick "Get the latest data in real time with DirectQuery (Premium only)".','Publish to a capacity/PPU workspace → Refresh → inspect partitions via XMLA (SSMS or Tabular Editor).','INSERT a row with today\'s date in SQL → refresh the report page (not the model).'],
check:'Import partitions for history plus one DirectQuery partition for the current period. Today\'s row appears without a data refresh.'},

'a-composite-3':{
tbl:[['Mode','Size','Latency','DAX limits','RLS','Refresh'],
 ['Import','Compressed model up to 1 GB on Pro; larger on PPU/capacity','As of the last refresh','None','Full','Scheduled (8/day Pro, 48/day capacity)'],
 ['DirectQuery','Source-limited','Near real-time','Some functions limited; 1M-row limit on intermediate results','Full, plus optional source SSO','None for data'],
 ['Dual','Like Import (keeps a copy)','Import when possible, DirectQuery when joined to DQ tables','None','Full','Scheduled (for the import copy)'],
 ['Direct Lake','Capacity guardrails per SKU','Minutes after the Delta table changes','Calculated columns/tables on Direct Lake tables restricted','Full in the model; RLS on the SQL endpoint forces DirectQuery fallback','Framing (metadata only, seconds)']],
s:['DimProduct → Properties → Advanced → Storage mode → Dual.'],
check:'Dual lets a dimension join Import aggregations in memory and still join the DirectQuery fact at the source, with no limited relationships and no double work.'},

'a-deploy-0':{
s:['File → Options → Preview features → Power BI Project (.pbip) save option and TMDL format. File → Save as → .pbip.','Run the git commands below in the project folder.','Edit a measure in Desktop → save → git diff. Then edit the same measure in the .tmdl file → close and reopen the .pbip.','Fabric workspace → Workspace settings → Git integration → connect repo/branch → Commit/Update.'],
code:[['Shell','Git basics',
`git init
git add .
git commit -m "Initial PBIP"
# after changing a measure in Desktop and saving:
git diff -- "*.tmdl"`],['TMDL','A measure in tables/_Measures.tmdl',
`	measure 'Net Sales' = [Gross Sales] - [Discount Amt]
		formatString: \\$#,0.00;(\\$#,0.00);\\$#,0.00
		displayFolder: Sales`]],
check:'git diff shows a single changed line: the measure expression.'},

'a-deploy-1':{
s:['Deployment pipelines → Create → 3 stages → assign Northwind-Dev to Development.','Deploy to Test → Deployment rules (lightning icon) on the Test semantic model → Parameter rules → Environment = Test. Do the same for Prod.','Change a measure in Dev → the Test column shows "Different" → Compare → Deploy.','Select only the semantic model → Deploy (selective deployment).'],
check:'Prod\'s model reads the Prod source. Nobody edited the PBIX.'},

'a-deploy-2':{
code:[['C#','Tabular Editor 2: create PY siblings for every *Sales measure',
`foreach (var m in Model.AllMeasures.Where(x => x.Name.EndsWith("Sales")).ToList())
{
    var py = m.Table.AddMeasure(
        m.Name + " PY",
        "CALCULATE(" + m.DaxObjectName + ", SAMEPERIODLASTYEAR('Dates'[Date]))",
        m.DisplayFolder
    );
    py.FormatString = m.FormatString;
    py.Description = "Prior-year version of " + m.Name + ".";
}

// Format every measure with the built-in DAX formatter
Model.AllMeasures.FormatDax();`]],
s:['Tools → Best Practice Analyzer → Manage rules → add the standard rule collection → Refresh → fix or ignore each item with a documented reason.','XMLA: File → Open → From DB → powerbi://api.powerbi.com/v1.0/myorg/<workspace>.'],
check:'BPA shows 0 errors. After saving via XMLA, the Service no longer lets you download the model as a .pbix.'},

'a-deploy-3':{
code:[['Shell','Tag, break, roll back',
`git tag -a v1.0 -m "Release 1.0"
git push origin v1.0
# ...breaking change deployed...
git checkout v1.0 -- "Northwind.SemanticModel"
git commit -m "Roll back semantic model to v1.0"
git push   # then Update all in the workspace Git panel`],['Text','Release note template',
`Subject: Northwind model v1.1 – released <date>
What changed: <measures/columns added, renamed, removed>
Action needed: <none | update visuals that use X before <date>>
Why: <business reason in one sentence>
Rollback plan: <tag v1.0, contact>
Questions: <owner, channel>`]],
check:'After the rollback sync the broken visual renders again, with no change to the report.'},

'a-fabric-0':{
s:['Fabric workspace → New → Dataflow Gen2 → Get data → Blank query → paste the Beginner clean-up M (replace Source with a OneLake file or web URL).','Query settings → Data destination → Lakehouse → new table "orders_clean" → Replace.','Model A: Lakehouse SQL analytics endpoint → New semantic model. Model B: Power BI Desktop → Get Data → Dataflows.','Rename a source column → refresh the dataflow → compare the error messages.'],
check:'Both models consume the same cleaned output. When the source changes, one fix in the dataflow repairs both.'},

'a-fabric-1':{
s:['Lakehouse → Files → Upload → all 14 CSVs → right-click each → Load to Tables → New table.','Lakehouse → New semantic model → select the tables → open the web model editor → drag relationships as in Beginner.','Build a visual. In DAX Studio, connect to the model and trace: DirectQuery events mean fallback happened.','Try adding a calculated column → note the restriction or fallback → remove it.'],
check:'Two fallback triggers: views (or RLS) on the SQL analytics endpoint, and exceeding the capacity guardrails (rows, size, files). Calculated columns on Direct Lake tables are restricted.'},

'a-fabric-2':{
code:[['Python','PySpark notebook: sessions table',
`from pyspark.sql import functions as F

events = (spark.read.option("header", True).option("inferSchema", True)
          .csv("Files/WebEvents.csv")
          .withColumn("EventTime", F.to_timestamp("EventTime")))

stage = (F.when(F.col("EventType") == "PageView", 1)
          .when(F.col("EventType") == "ProductView", 2)
          .when(F.col("EventType") == "AddToCart", 3)
          .when(F.col("EventType") == "Checkout", 4)
          .when(F.col("EventType") == "Purchase", 5))

sessions = (events.withColumn("StageRank", stage)
    .groupBy("SessionID", "CustomerKey", "DeviceType")
    .agg(F.min("EventTime").alias("FirstEvent"),
         F.max("EventTime").alias("LastEvent"),
         F.max("StageRank").alias("FurthestStage"))
    .withColumn("SessionMinutes",
                (F.col("LastEvent").cast("long") - F.col("FirstEvent").cast("long")) / 60))

sessions.write.mode("overwrite").format("delta").saveAsTable("sessions")`],['DAX','Funnel measure with a disconnected Stage table (Rank 1–5)',
`Sessions Reaching Stage =
VAR s = SELECTEDVALUE ( Stage[Rank] )
RETURN CALCULATE ( COUNTROWS ( sessions ), sessions[FurthestStage] >= s )`]],
check:'Funnel: PageView 39 → ProductView 28 → AddToCart 16 → Checkout 11 → Purchase 6.'},

'a-fabric-3':{
tbl:[['Logic','Where it lives','Why'],
 ['Currency conversion','Power Query / Lakehouse (daily rate per row); DAX only for a user-chosen currency','Row-level and stable: do it once at load.'],
 ['Customer ABC class','DAX','Depends on the user\'s current filters (ALLSELECTED).'],
 ['Cleaning the messy export','Dataflow / Power Query','Pure data preparation, reused by every consumer.'],
 ['Budget allocation to days','Lakehouse / Power Query','A fixed business rule that produces rows. Do it upstream.'],
 ['RLS mapping','Source table (HR/security system), applied by a DAX role','Data upstream, enforcement in the model.'],
 ['Session duration','Notebook / Lakehouse','Row-by-row sequence logic is cheap in Spark and expensive in DAX.']],
check:'Only ABC class (and the RLS rule itself) land in DAX: two of six.'},

'a-gov-0':{
s:['Tabular Editor → Model → Roles → new role "NoSalary" → select DimEmployee[Salary] → Object Level Security → NoSalary = None. Save.','Service → Security → add the test user to NoSalary (and to the RLS role).'],
check:'Visuals that use Salary show an error for that user. Others work. RLS still filters rows.',
note:'OLS makes the column not exist for that user. A visual that references a non-existent field can\'t render, so it errors instead of going blank. Design separate pages for restricted audiences.'},

'a-gov-1':{
code:[['C#','Tabular Editor: flag measures missing a description',
`foreach (var m in Model.AllMeasures.Where(x => string.IsNullOrWhiteSpace(x.Description)))
    m.Description = "TODO: describe " + m.Name;`],['DAX','Model guide (DAX query view or DAX Studio)',
`EVALUATE
SELECTCOLUMNS (
    INFO.MEASURES (),
    "Measure", [Name],
    "Expression", [Expression],
    "Description", [Description],
    "Folder", [DisplayFolder]
)`]],
s:['Model view → select a field → Properties → Synonyms (for Q&A).','Service → semantic model → Settings → Endorsement → Certified (needs admin permission) and Sensitivity label.'],
check:'Every visible measure has a description, and the guide page lists them all.'},

'a-gov-2':{
s:['Report → … → Open usage metrics → Report pages tab: sort by views.','Workspace → View → Lineage → select the Lakehouse → everything downstream is highlighted.','Fabric Capacity Metrics app → Compute page → items sorted by CU(s).'],
check:'A written list: three candidates to retire (low or no views) and one heavy item to optimise.'},

'a-gov-3':{
code:[['Text','Model answers (≈100 words each)',
`(1) CFO – "Why is the report slow?"
It's slow because it answers too many detailed questions at once every time you open it. We'll move the detail behind a click and pre-summarise the monthly numbers. Opening will take under three seconds, and the numbers won't change. I recommend we approve two days of work this sprint.

(2) Data engineer – same question
Performance Analyzer shows 70% of time in one visual. Its measure iterates FactSales row by row with a callback, and SalesKey plus a datetime column dominate model size. Plan: drop SalesKey, split datetime, rewrite the measure over VALUES(Customer), and add a month-category aggregation. Can you give us a date-level view with a ModifiedDate so incremental refresh folds?

(3) CTO – "Should we go Fabric?"
Yes, in stages. Fabric puts our data and Power BI on one copy of the data, which removes nightly imports and duplicate storage. We should start with one domain on an F64 trial, measure capacity use, and decide on the licence after 60 days.

(4) Analyst – "Why can't I just export everything to Excel?"
You can export what you see. Bulk exports copy confidential data outside our controls and go stale the moment you save them. Tell me which question you're answering and I'll give you Analyze in Excel on the certified model: live data and your own pivots, secured.`]],
check:'Each answer ends with a recommendation. The CFO answer has no jargon.'}
};
