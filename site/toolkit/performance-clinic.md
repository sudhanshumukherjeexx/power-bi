# Power BI Performance Clinic

Find what is slow first (rendering, DAX, model, Power Query, source SQL, gateway or capacity), then the fixes for each layer, with the tools that prove it.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html

## Rule one: measure before you change anything

Performance work without a baseline is guessing. Record the time for the slow page or query (Performance Analyzer for visuals, DAX Studio for queries with a cold cache, refresh history for refreshes), change one thing, measure again, and write the before and after in a [performance report](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-performance-report). [Sprint 04](https://sudhanshumukherjeexx.github.io/power-bi/experience/s04-monday-performance-incident.html) is a full exercise in this.

## What is slow?

```tree
"The report is slow." What exactly is slow?
  Opening or interacting with a page?
    Performance Analyzer: is the time in "DAX query"?
      → One or two visuals dominate: DAX performance, then Model performance.
    In "Visual display" and "Other"?
      → Report performance: too many visuals, heavy visuals, slicers.
    Is the model DirectQuery or composite?
      → DirectQuery: source SQL, network and gateway.
  Refresh takes too long or fails?
    → Refresh: folding, partitions, incremental refresh, gateway, parallelism.
  Everything is slow at certain times for everyone?
    → Capacity: throttling and concurrency.
```

## Report performance

- **Too many visuals.** Each visual sends at least one query. A page with 30 cards is 30 queries; combine KPIs into one visual or use a multi-row card.
- **High-cardinality slicers.** A slicer listing 50,000 customers queries and renders all of them. Use search, a hierarchy, or a filter pane filter.
- **Interactions.** Cross-highlighting re-queries every visual on the page. Turn off interactions that nobody uses (Format → Edit interactions).
- **Custom visuals.** Some render slowly or send heavy queries; test them with Performance Analyzer before standardising on one.
- **Bookmarks and stacked visuals.** Pages that toggle layers of visuals with bookmarks are hard to test and easy to make slow. Measure them with Performance Analyzer, and prefer separate pages for big switches.
- **Unnecessary queries.** Visual-level filters with complex measures, tooltips pages on every visual, and "show items with no data" all add work.

Budget: aim for every page to render in a few seconds on the target capacity, and write the budget down so regressions are visible ([performance budgets](https://sudhanshumukherjeexx.github.io/power-bi/testing.html#qa-ops)).

## DAX performance

The engine has two parts: the **storage engine** (SE: fast, multi-threaded, scans compressed columns, caches results) and the **formula engine** (FE: single-threaded, handles everything the SE can't). Fast queries do most of their work in the SE.

In DAX Studio, run the query with **Server Timings** on and a cleared cache:

| What you see | Likely cause | Fix |
|---|---|---|
| High FE time, few SE queries | Complex logic per row in the FE, large iterations | Iterate a smaller table (a dimension or `VALUES` of a column); pre-compute in a column or upstream |
| Many SE queries (dozens or hundreds) | Context transition inside an iterator over many rows | Reduce the iterator's cardinality; replace measure calls inside iterators with columns; use variables |
| SE queries with `CallbackDataID` | The SE calls back into the FE per row (for example `IF`, `DIVIDE` inside an iterator) | Move the condition out of the iterator, or filter first and aggregate after |
| Huge materialisations (millions of rows returned to the FE) | `FILTER` over a fact table, `SUMMARIZE` with many columns | Filter columns not tables; `KEEPFILTERS`; `SUMMARIZECOLUMNS` |
| The same expression computed repeatedly | No variables | `VAR` it once |

> **Senior:** Don't optimise a measure until you've confirmed it is the bottleneck. A clean, readable measure that costs 50 ms isn't worth making clever.

## Model performance

- **Cardinality is cost.** VertiPaq compresses columns with few distinct values extremely well. Timestamps with seconds, GUIDs, free text and transaction IDs are the usual memory hogs. Split date and time, round, or drop columns nobody uses.
- **Model size** drives refresh memory and query speed. Check it in VertiPaq Analyzer.
- **Calculated columns** are computed after load and compress worse than imported columns. Build them in Power Query or SQL.
- **Data types.** Whole numbers compress better than decimals, decimals better than text. Fixed decimal for money.
- **Relationship design.** Star schema, single direction, integer keys. Bidirectional and many-to-many relationships make every query heavier.
- **Auto date/time.** Turn it off; it creates a hidden date table for every date column.
- **Pre-aggregation.** If reports only ever show months and categories, an aggregated table answers them without scanning detail.

## DirectQuery

Every visual becomes SQL against the source, every time.

- **Generated SQL:** copy it from Performance Analyzer and run it at the source.
- **Indexes:** the source must be tuned for the queries Power BI sends; read the [execution plan](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/sql-for-bi.html#reading-an-execution-plan).
- **Source latency and load:** a busy OLTP database will be slow for reports and reports will slow it down. Report from a replica or warehouse.
- **Transformations:** Power Query steps in DirectQuery become part of every query; keep them minimal or move them into a view.
- **Aggregations:** an Import aggregation table (by month and category) can answer most visuals, with DirectQuery only for detail.
- **Limits:** queries returning more than a million intermediate rows fail by design.

## Refresh

- **Folding:** the date filter and column selection should fold to the source ([field guide](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#query-folding)).
- **Incremental refresh:** refresh only recent partitions; keep history untouched. Requires a foldable date filter on `RangeStart` / `RangeEnd`.
- **Partitions:** with XMLA you can refresh one table or partition instead of the whole model.
- **Gateway:** size and cluster it; the gateway machine's CPU and memory limit on-premises refresh and DirectQuery ([sizing guidance](https://learn.microsoft.com/en-us/power-bi/guidance/gateway-onprem-sizing)).
- **Parallelism:** many queries refreshing at once can overwhelm a small source. Schedule big models apart, or limit parallel queries.
- **Do less:** every column and row you don't load is refresh time you don't spend.

## Capacity

- **Throttling:** when a capacity uses more compute than it has over time, Fabric first delays interactive requests and then rejects them. Background work (refresh) is smoothed over a longer window than interactive work.
- **Concurrency:** many users opening the same heavy page at 9:00 behave like a load test.
- **Memory:** each model must fit in the capacity's per-model memory limit, including during refresh.
- **CU consumption:** the [Capacity Metrics app](https://learn.microsoft.com/en-us/fabric/enterprise/metrics-app) shows which items and operations use compute. Fix the top consumer before buying a bigger SKU.

## Prove it

A performance fix is finished when you can show the before and after under the same conditions, the regression check that will catch it next time, and the budget it now meets. Use the [performance review checklist](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/checklists.html#performance-review-checklist).
