---
{
  "id": "sql-for-bi",
  "title": "SQL you need to survive as a BI developer",
  "summary": "Not SQL from scratch: the queries a BI developer reads and writes every week, why each matters for Power BI, and a decision guide for where each transformation should happen.",
  "door": "reference",
  "group": "Languages",
  "kind": "reference",
  "order": 4,
  "stages": ["developer", "senior", "engineer"],
  "skills": ["sql", "warehousing", "performance"],
  "tools": ["sql", "ssms"],
  "problems": ["directquery-slow", "slow-refresh", "model-design"],
  "certs": ["dp600"],
  "keywords": ["select", "join", "group by", "cte", "window functions", "row_number", "case", "views", "stored procedures", "indexes", "execution plan", "temp tables", "incremental", "where should transformation happen", "power query vs sql"],
  "lessons": ["sql-query", "sql-window", "sql-load", "sql-tune", "dw-keys"],
  "scenarios": ["s04", "s08"],
  "download": true,
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Transact-SQL reference", "u": "https://learn.microsoft.com/en-us/sql/t-sql/language-reference", "src": "official" },
    { "t": "Execution plans", "u": "https://learn.microsoft.com/en-us/sql/relational-databases/performance/execution-plans", "src": "official" },
    { "t": "DirectQuery model guidance", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/directquery-model-guidance", "src": "official" },
    { "t": "Incremental refresh overview", "u": "https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-overview", "src": "official" }
  ]
}
---
## The SQL that matters, and why

Examples use the course's company pack (`orders`, `order_lines`, `customers`, `products`, `regions`; amounts are in each order's currency). The [SQL track](sql.html) has assignments with answers that are executed in CI.

| Topic | What it's for in BI | Learn it |
|---|---|---|
| `SELECT`, `WHERE` | Extract only the rows and columns the model needs | [Querying for BI](sql.html#sql-query) |
| `JOIN` | Assemble facts with their keys; find orphans with `LEFT JOIN … WHERE x IS NULL` | [Querying for BI](sql.html#sql-query) |
| `GROUP BY` | Pre-aggregate before import; reconcile totals with the source | [Querying for BI](sql.html#sql-query) |
| CTEs | Readable, testable transformation steps | [CTEs and windows](sql.html#sql-window) |
| Window functions | Deduplicate, rank, running totals, "latest row per key" | [CTEs and windows](sql.html#sql-window) |
| `CASE` | Classify and clean in one pass | [Querying for BI](sql.html#sql-query) |
| Views | A stable, documented interface between source and model | [Views and loads](sql.html#sql-load) |
| Stored procedures | Controlled, parameterised extracts and loads | [Views and loads](sql.html#sql-load) |
| Indexes | Make DirectQuery and incremental-refresh queries fast | [Slow source queries](sql.html#sql-tune) |
| Execution plans | See *why* a query is slow before guessing | [Slow source queries](sql.html#sql-tune) |
| Temp tables | Stage multi-step transformations | [Views and loads](sql.html#sql-load) |
| SCD patterns | Keep dimension history correct | [Keys and SCDs](warehousing.html#dw-keys) |
| Incremental predicates | Load only what changed | [Views and loads](sql.html#sql-load) |
| Date functions | Calendars, fiscal periods, time zones | [Calendars and time zones](warehousing.html#dw-time) |

## Patterns you'll use weekly

### One row per key (deduplicate)

```sql portable
-- order_lines contains a re-exported batch: the same (OrderID, LineNo) appears twice
WITH ranked AS (
  SELECT ol.*,
         ROW_NUMBER() OVER (PARTITION BY OrderID, "LineNo" ORDER BY ProductKey) AS rn
  FROM order_lines AS ol
)
SELECT * FROM ranked WHERE rn = 1;
```

When the source has a load timestamp or version column, order by it descending so you keep the latest copy rather than an arbitrary one.

### Orphans: facts with no dimension row

```sql portable
SELECT ol.ProductKey, COUNT(*) AS lines
FROM order_lines AS ol
LEFT JOIN products AS p ON p.ProductKey = ol.ProductKey
WHERE p.ProductKey IS NULL
GROUP BY ol.ProductKey;
```

### Reconcile the report with the source

```sql sqlite
SELECT strftime('%Y-%m', o.OrderDate) AS month,          -- FORMAT(o.OrderDate, 'yyyy-MM') in T-SQL
       ROUND(SUM(ol.Qty * ol.UnitPrice * (1 - ol.DiscountPct / 100.0)), 2) AS net_sales,
       COUNT(DISTINCT o.OrderID) AS orders
FROM orders AS o
JOIN order_lines AS ol ON ol.OrderID = o.OrderID
GROUP BY 1
ORDER BY 1;
```

Put the result next to the same breakdown from your model. If they differ, the model is wrong until proven otherwise.

### Running total

```sql portable
SELECT month, net_sales,
       SUM(net_sales) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) AS running
FROM monthly_sales;
```

### Incremental extract

```sql tsql
-- the predicate Power BI's incremental refresh folds into each partition query
SELECT * FROM orders
WHERE OrderDate >= @RangeStart AND OrderDate < @RangeEnd;
```

Note the `>=` and `<`: with `<=` on both ends a row exactly on the boundary loads into two partitions.

## Reading an execution plan

When a DirectQuery visual or a refresh is slow, capture the SQL Power BI sends (Performance Analyzer → Copy query, or a trace in DAX Studio), run it in SSMS with **Include Actual Execution Plan**, and look for:

- **Scans on big tables** where you expected seeks: a missing or unusable index (functions on the column, such as `YEAR(OrderDate) = 2026`, prevent seeks; write `OrderDate >= '2026-01-01' AND OrderDate < '2027-01-01'`).
- **Huge estimated vs actual row differences**: stale statistics.
- **Key lookups repeated millions of times**: add included columns to the index.
- **Sorts and hash matches spilling to tempdb**: memory grants too small for the data volume.

Then fix the source (index, view, pre-aggregated table) before you fix the model.

## Where should this transformation happen?

Do work as far upstream as is practical, and as far downstream as is necessary. Roche's maxim, in practice:

| Operation | Usually prefer | Why |
|---|---|---|
| Rename columns for business users | Power Query or the model | Presentation concern; cheap anywhere |
| Aggregate 300 million rows | SQL or the warehouse | The engine built for it, close to the data |
| A business metric (Revenue, Margin %) | DAX measure in a shared semantic model | Must respond to filters; one definition for every report |
| Slowly changing dimension type 2 | Warehouse | Needs history the model can't reconstruct |
| A display label ("Q1 2026") | Date table column | Computed once, sortable |
| Fix bad source data | At the source, or the first upstream layer | Every consumer benefits; the model only hides it |
| A KPI shared across reports | Measure in a certified model | Prevents three different "Revenue" numbers ([Sprint 05](experience/s05-one-revenue-semantic-model.html)) |
| One-off clean-up for an ad-hoc analysis | Power Query | Fast to change, nobody else depends on it |
| Joins that create the star schema | Warehouse views, or Power Query when there's no warehouse | Folds to the source; keeps the model simple |
| Currency conversion | Upstream, stored as converted amounts | Per-row lookups in DAX are slow |

## Dialects

The course uses portable SQL, and CI runs it on SQLite. At work you'll mostly meet T-SQL (SQL Server, Azure SQL, Fabric Warehouse and SQL analytics endpoints). The differences you'll hit first: date formatting (`FORMAT` vs `strftime`), `TOP n` vs `LIMIT n`, string concatenation (`+` or `CONCAT` vs `||`), and `ISNULL` vs `COALESCE` (use `COALESCE`: it's standard).
