# Northwind Outdoors datasets

These are the same 14 tables shown on the Datasets section of `index.html`, saved as CSV files. They come from the same seeded generator, so every value here matches the site row for row.

Northwind Outdoors is a fictional company. All figures are synthetic.

## How to load

- **Power BI Desktop:** Get Data → Text/CSV → pick a file. Or pick the whole folder with Get Data → Folder.
- **Excel:** open the file directly.
- **Fabric Lakehouse:** upload them to Files, then choose Load to Tables.

`RawOrdersExport.csv` is meant to be messy (header row, TOTAL row, mixed date formats, `$` and `USD` in prices). Don't clean it by hand: the first Power Query assignment is about cleaning it.

## Files

| File | Table | Rows | Cols | What it is for |
|---|---|---:|---:|---|
| [DimDate.csv](DimDate.csv) | DimDate | 90 | 12 | 90 continuous days, 1 Jan 2026 to 31 Mar 2026. Deliberately short: your first assignment is to replace it with a DAX date table. |
| [DimProduct.csv](DimProduct.csv) | DimProduct | 24 | 9 | 24 products in 4 categories. Includes a discontinued flag, unit cost and list price for margin calculations. |
| [DimCustomer.csv](DimCustomer.csv) | DimCustomer | 30 | 9 | 30 customers with segment, city, join date and loyalty tier. Some cities repeat across customers; join dates span 2022 to 2026 for cohort analysis. |
| [DimRegion.csv](DimRegion.csv) | DimRegion | 4 | 6 | 4 sales regions with the manager, target multiplier and country. The RegionKey is what FactSales, FactBudget and the RLS table join on. |
| [DimEmployee.csv](DimEmployee.csv) | DimEmployee | 18 | 8 | 18 employees in a parent-child hierarchy (ManagerKey points at another EmployeeKey). Built for PATH(), RLS by org position and hierarchy visuals. |
| [FactSales.csv](FactSales.csv) | FactSales | 100 | 12 | 100 order lines, Jan–Mar 2026. Multiple lines share an OrderID (for DISTINCTCOUNT), some lines are returns (negative quantity), and OrderDate ≠ ShipDate (role-playing dimension). Discount is a fraction of ListPrice. |
| [FactBudget.csv](FactBudget.csv) | FactBudget | 48 | 6 | 48 rows: monthly budget by Region × Category for Jan–Mar 2026. Different grain from FactSales (month, not day; category, not product). Built for budget vs actual and TREATAS. |
| [FactInventory.csv](FactInventory.csv) | FactInventory | 80 | 5 | 80 rows: weekly stock snapshot for 8 products × 10 weeks. A snapshot fact — summing QuantityOnHand across weeks is wrong. Built for semi-additive measures (LASTDATE, LASTNONBLANK). |
| [RawOrdersExport.csv](RawOrdersExport.csv) | RawOrdersExport (messy) | 30 | 9 | 30 rows exported from a legacy system. Contains: header junk row, mixed date formats, currency symbols in numbers, trailing spaces, inconsistent casing, a fully null column, duplicate rows and "N/A" strings. Your Power Query playground. |
| [SurveyWide.csv](SurveyWide.csv) | SurveyWide (unpivot) | 12 | 7 | 12 rows in a wide layout: one column per month. Built for Unpivot, and for the "why is this the wrong shape" conversation. |
| [UserRegionMapping.csv](UserRegionMapping.csv) | UserRegionMapping (RLS) | 12 | 3 | 12 rows mapping a login to one or more regions. Some users have two rows (multi-region), one user has ALL. Built for dynamic RLS with USERPRINCIPALNAME(). |
| [ExchangeRates.csv](ExchangeRates.csv) | ExchangeRates | 39 | 3 | 39 rows: weekly USD rates for EUR, GBP, CAD. Rates only exist on Mondays, so lookups need "last known rate" logic. Built for currency conversion patterns. |
| [CustomerTargets.csv](CustomerTargets.csv) | CustomerTargets (many-to-many) | 20 | 4 | 20 rows: quarterly revenue targets by Segment and LoyaltyTier, not by customer. Neither column is unique, so it cannot join 1:many to DimCustomer. Built for bridge tables and many-to-many. |
| [WebEvents.csv](WebEvents.csv) | WebEvents (sessions) | 100 | 7 | 100 rows of click events with SessionID, UserKey and timestamp. Built for funnel analysis, EARLIER/window functions, session duration, and "first purchase" cohort logic. |

## Relationships

| From (many) | To (one) | Key |
|---|---|---|
| FactSales | DimDate | OrderDate → Date (active), ShipDate → Date (inactive) |
| FactSales | DimProduct | ProductKey |
| FactSales | DimCustomer | CustomerKey |
| FactSales | DimEmployee | EmployeeKey |
| FactSales | DimRegion | RegionKey |
| FactBudget | DimRegion | RegionKey (Category and YearMonth need TREATAS or a bridge) |
| FactInventory | DimProduct | ProductKey |
| DimCustomer | DimRegion | RegionKey |
| WebEvents | DimCustomer | CustomerKey |
| UserRegionMapping | DimRegion | RegionKey (for RLS) |
| DimEmployee | DimRegion | RegionKey |
| SurveyWide | DimRegion | RegionKey (after unpivoting the month columns) |

DimEmployee.ManagerKey points to another EmployeeKey. It is a parent-child hierarchy for `PATH()`, not a model relationship. ExchangeRates and CustomerTargets have no direct 1-to-many key. The assignments show how to connect them.
