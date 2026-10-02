# DAX field manual

DAX organised by the problem you are solving, not alphabetically: contexts, filters, relationships, time, business patterns and senior patterns, each with working code on the Northwind model.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-field-manual.html

## How to read this manual

Every example uses the course's Northwind model: `FactSales` (one row per order line), `DimDate`, `DimProduct`, `DimCustomer`, `DimRegion`, `FactBudget` and `FactInventory`. The base measure is:

```dax
Net Sales =
SUMX ( FactSales, FactSales[Quantity] * FactSales[UnitPrice] * ( 1 - FactSales[Discount] ) )
```

Something wrong with a number rather than a gap in your knowledge? Go to [My DAX is wrong](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-debugging.html) instead.

## Fundamentals

### Measures vs calculated columns

| | Calculated column | Measure |
|---|---|---|
| Computed | At refresh, once per row | At query time, for each cell of a visual |
| Sees | The current row (row context) | The filters on the visual (filter context) |
| Stored | Yes: costs memory | No |
| Use for | Slicing, grouping, relationship keys, values you filter **by** | Every number you aggregate **into** a visual |

> **Rule:** If it is a number someone reads off a visual, it is a measure. If you need to put it on an axis or slicer, it is a column, ideally built upstream in Power Query or SQL.

### Row context and filter context

- **Row context** exists in calculated columns and inside iterators (`SUMX`, `FILTER`, `ADDCOLUMNS`): "the current row". It does **not** filter anything by itself.
- **Filter context** is the set of filters from slicers, rows, columns and `CALCULATE`: "which rows are visible".

### Context transition

`CALCULATE` turns the current row context into an equivalent filter context. That is why a measure referenced inside an iterator is evaluated per row:

```dax
Customers with 2+ Orders =
COUNTROWS (
    FILTER ( DimCustomer, CALCULATE ( DISTINCTCOUNT ( FactSales[OrderID] ) ) >= 2 )
)
```

Every measure reference has an implicit `CALCULATE` around it, so `[Net Sales]` inside `FILTER ( DimCustomer, … )` is the net sales of each customer. Context transition on a large table without a unique key is slow and can double-count; iterate over a dimension or `VALUES` of a key, not over a fact table, when you can.

### CALCULATE

`CALCULATE ( expression, filter1, filter2, … )` evaluates `expression` in a modified filter context. Filters on the same column replace the existing filter; filters on different columns are combined with AND.

```dax
West Sales = CALCULATE ( [Net Sales], DimRegion[RegionName] = "West" )   -- replaces any region filter
Online Share = DIVIDE ( CALCULATE ( [Net Sales], FactSales[Channel] = "Online" ), [Net Sales] )
```

### Variables

Variables are evaluated once, where they are defined, in the filter context at that point. They make code readable, avoid repeated work and are the easiest debugging tool you have (return a variable to see it).

```dax
Margin % =
VAR Sales = [Net Sales]
VAR Cost  = SUMX ( FactSales, FactSales[Quantity] * RELATED ( DimProduct[UnitCost] ) )
RETURN DIVIDE ( Sales - Cost, Sales )
```

### Iterators and table expressions

`SUMX`, `AVERAGEX`, `MAXX`, `COUNTX` and `RANKX` loop over a table and evaluate an expression per row. Table functions (`FILTER`, `VALUES`, `ALL`, `SUMMARIZE`, `ADDCOLUMNS`, `TOPN`) return tables you can iterate or pass to `CALCULATE`. Test table expressions directly in [DAX query view](https://learn.microsoft.com/en-us/power-bi/transform-model/dax-query-view) with `EVALUATE`.

## Filters

| Function | What it does | Typical use |
|---|---|---|
| `FILTER ( table, condition )` | Iterates a table, keeps rows where the condition is true | Conditions on measures, or on several columns at once |
| `ALL ( table or column )` | Removes filters (and as a table function, returns all rows) | Denominator of "% of total" |
| `REMOVEFILTERS ( … )` | Removes filters; only valid as a `CALCULATE` modifier | Same as `ALL` but says what it means |
| `ALLSELECTED ( … )` | Removes filters from inside the visual, keeps slicers and page filters | "% of what's selected" |
| `KEEPFILTERS ( … )` | Intersects with the existing filter instead of replacing it | Measures that must respect a slicer on the same column |
| `VALUES ( column )` | Distinct visible values, plus the blank row if relationships are broken | Iterating visible members |
| `SELECTEDVALUE ( column, alt )` | The single visible value, or `alt` | Titles, what-if parameters |

```dax
% of All Regions = DIVIDE ( [Net Sales], CALCULATE ( [Net Sales], REMOVEFILTERS ( DimRegion ) ) )
% of Selection   = DIVIDE ( [Net Sales], CALCULATE ( [Net Sales], ALLSELECTED ( DimRegion ) ) )
Bike Sales (respects slicer) = CALCULATE ( [Net Sales], KEEPFILTERS ( DimProduct[Category] = "Bikes" ) )
```

> **Warning:** `FILTER ( FactSales, … )` as a `CALCULATE` argument iterates the whole fact table and keeps every column's filter. Filter columns, not tables: `CALCULATE ( [Net Sales], FactSales[Quantity] > 5 )` or `FILTER ( ALL ( FactSales[Quantity] ), … )`.

## Relationships

| Function | Use it when |
|---|---|
| `RELATED ( DimProduct[Category] )` | In a row context on the many side, fetch a value from the one side |
| `RELATEDTABLE ( FactSales )` | On the one side, get the related many-side rows |
| `USERELATIONSHIP ( FactSales[ShipDate], DimDate[Date] )` | Activate an inactive relationship for one calculation |
| `CROSSFILTER ( a, b, Both )` | Change filter direction for one calculation instead of the whole model |
| `TREATAS ( VALUES ( … ), … )` | Apply a filter through a "virtual relationship" where none exists |

```dax
Sales by Ship Date = CALCULATE ( [Net Sales], USERELATIONSHIP ( FactSales[ShipDate], DimDate[Date] ) )

-- budget is by month and category, not by day and product: filter it through the shared columns
Budget = SUM ( FactBudget[BudgetAmount] )
Budget (via product category) =
CALCULATE ( [Budget], TREATAS ( VALUES ( DimProduct[Category] ), FactBudget[Category] ) )
```

## Time intelligence

Time-intelligence functions need a proper date table: one row per day, no gaps, covering every year in the facts, marked as a date table. The course's `DimDate` is deliberately too short; replacing it is your first [intermediate modeling](https://sudhanshumukherjeexx.github.io/power-bi/intermediate.html#i-model) job.

```dax
Sales YTD      = TOTALYTD ( [Net Sales], DimDate[Date] )
Sales PY       = CALCULATE ( [Net Sales], SAMEPERIODLASTYEAR ( DimDate[Date] ) )
Sales vs PY %  = DIVIDE ( [Net Sales] - [Sales PY], [Sales PY] )
Sales Last 3M  = CALCULATE ( [Net Sales], DATESINPERIOD ( DimDate[Date], MAX ( DimDate[Date] ), -3, MONTH ) )
Sales FYTD     = TOTALYTD ( [Net Sales], DimDate[Date], "06-30" )   -- fiscal year ending 30 June
Sales Prev Mth = CALCULATE ( [Net Sales], DATEADD ( DimDate[Date], -1, MONTH ) )
```

Fiscal calendars that aren't "a year ending on a date" (4-4-5, 52/53-week retail years) need columns in the date table and filter logic on them; the classic time-intelligence functions assume a Gregorian calendar. See the week-based patterns on [DAX Patterns](https://www.daxpatterns.com/).

## Business patterns

### Running total

```dax
Running Sales =
CALCULATE ( [Net Sales], DimDate[Date] <= MAX ( DimDate[Date] ), REMOVEFILTERS ( DimDate ) )
```

On a visual, [visual calculations](https://sudhanshumukherjeexx.github.io/power-bi/modern.html#mod-viscalc) do the same with `RUNNINGSUM([Net Sales])` and no model change.

### Ranking

```dax
Product Rank = RANKX ( ALLSELECTED ( DimProduct[ProductName] ), [Net Sales], , DESC, DENSE )
```

`RANKX` over `ALL` ranks against every product; over `ALLSELECTED` it ranks within the slicer selection. Ties: `DENSE` gives 1, 2, 2, 3; `SKIP` gives 1, 2, 2, 4.

### ABC classification

```dax
ABC Class =
VAR ThisSales = [Net Sales]
VAR Total     = CALCULATE ( [Net Sales], ALLSELECTED ( DimProduct ) )
VAR Cumulative =
    SUMX ( FILTER ( ALLSELECTED ( DimProduct[ProductName] ), [Net Sales] >= ThisSales ), [Net Sales] )
VAR Share = DIVIDE ( Cumulative, Total )
RETURN SWITCH ( TRUE (), Share <= 0.7, "A", Share <= 0.9, "B", "C" )
```

### New vs returning customers

```dax
New Customers =
VAR FirstDates =
    ADDCOLUMNS ( VALUES ( FactSales[CustomerKey] ),
        "@First", CALCULATE ( MIN ( FactSales[OrderDate] ), REMOVEFILTERS ( DimDate ) ) )
RETURN COUNTROWS ( FILTER ( FirstDates, [@First] >= MIN ( DimDate[Date] ) && [@First] <= MAX ( DimDate[Date] ) ) )

Returning Customers = DISTINCTCOUNT ( FactSales[CustomerKey] ) - [New Customers]
```

### Budget vs actual at different grains

Budget is by month × region × category; sales are by day × product. Relate the budget to dimensions at its grain (a month column, `DimRegion`, a category) and report at that grain or above. Below it, show blank rather than an invented split:

```dax
Budget (safe) = IF ( ISINSCOPE ( DimProduct[ProductName] ) || ISINSCOPE ( DimDate[Date] ), BLANK (), [Budget] )
```

### Currency conversion

Rates in `ExchangeRates` exist only on Mondays, so each sale needs the last known rate on or before its date:

```dax
Sales USD =
SUMX ( FactSales,
    VAR d   = FactSales[OrderDate]
    VAR cur = "EUR"   -- replace with the row's currency column in a multi-currency model
    VAR RateDate = CALCULATE ( MAX ( ExchangeRates[RateDate] ), ExchangeRates[Currency] = cur, ExchangeRates[RateDate] <= d, REMOVEFILTERS ( ExchangeRates ) )
    VAR Rate = CALCULATE ( MAX ( ExchangeRates[RateToUSD] ), ExchangeRates[Currency] = cur, ExchangeRates[RateDate] = RateDate, REMOVEFILTERS ( ExchangeRates ) )
    RETURN FactSales[Quantity] * FactSales[UnitPrice] * Rate )
```

At scale, do this lookup upstream (SQL or Power Query) and store the converted amount: per-row lookups in a measure are slow.

### Semi-additive measures: inventory and balances

`FactInventory` is a weekly snapshot. Summing `QuantityOnHand` across weeks is wrong; you want the balance at the last date in the period:

```dax
Stock on Hand =
CALCULATE ( SUM ( FactInventory[QuantityOnHand] ), LASTNONBLANK ( DimDate[Date], CALCULATE ( COUNTROWS ( FactInventory ) ) ) )
```

`LASTNONBLANK` finds the last date that actually has a snapshot, which matters when the period ends between snapshots.

### Cohorts

Assign each customer a cohort (the month of their first order) as a **calculated column** on `DimCustomer` or upstream, then count active customers per cohort with a measure. Cohort membership is a property of the customer, so it belongs in the dimension, not recomputed per cell.

## Senior patterns

### Calculation groups

One calculation item (YTD, PY, YoY %) applies to every measure, instead of writing `Sales YTD`, `Margin YTD`, `Units YTD`…

```dax
-- calculation item "YTD" in a calculation group "Time Calc"
CALCULATE ( SELECTEDMEASURE (), DATESYTD ( DimDate[Date] ) )
```

Create them in Desktop's model view or in Tabular Editor. Set a format string expression for items like "YoY %" that change the format.

### Window functions

`OFFSET`, `INDEX` and `WINDOW` work over a sorted, partitioned table, so "previous month" or "rank within category" no longer need date tricks:

```dax
Sales Prev Month (window) =
CALCULATE ( [Net Sales], OFFSET ( -1, ALLSELECTED ( DimDate[Year], DimDate[MonthNumber] ), ORDERBY ( DimDate[Year], ASC, DimDate[MonthNumber], ASC ) ) )
```

### Dynamic segmentation with a disconnected table

A table of bands (`Segment`, `Min`, `Max`) with **no** relationship, used to group customers by a measure:

```dax
Customers in Band =
COUNTROWS ( FILTER ( VALUES ( DimCustomer[CustomerKey] ),
    VAR s = [Net Sales]
    RETURN s >= MIN ( Bands[Min] ) && s < MAX ( Bands[Max] ) ) )
```

### Field parameters and custom totals

**Field parameters** let users swap the measure or column on a visual with a slicer. **Custom totals** (when the total must not be the sum of the rows, such as an average of monthly balances) use `ISINSCOPE` to return different logic at the total:

```dax
Avg Monthly Stock =
IF ( ISINSCOPE ( DimDate[MonthName] ), [Stock on Hand], AVERAGEX ( VALUES ( DimDate[MonthName] ), [Stock on Hand] ) )
```

## Formatting and naming

Format code so a reviewer can read it: one function per line for anything non-trivial, variables named for what they hold, and measure names a business user would recognise. Use [DAX Formatter](https://www.daxformatter.com/) or the formatter built into Tabular Editor, and agree names in the [best-practice library](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/best-practices.html#measure-naming).
