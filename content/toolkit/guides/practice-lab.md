---
{
  "id": "practice-lab",
  "title": "Datasets and practice lab",
  "summary": "Three tiers of practice data (small learning datasets, messy scenario files and a 100k–50M row enterprise generator) with each dataset's type, grain, scale, intended use and planted problems.",
  "door": "practice",
  "kind": "library",
  "order": 1,
  "stages": ["analyst", "developer", "senior", "engineer"],
  "skills": ["modeling", "dax", "power-query", "performance", "testing", "sql"],
  "tools": ["desktop", "sql", "python"],
  "problems": ["model-design", "memory", "slow-report"],
  "keywords": ["datasets", "sample data", "practice data", "csv", "northwind", "fact table", "dimension", "grain", "enterprise data generator", "million rows", "broken model", "lab"],
  "lessons": ["b-pq", "b-model", "a-perf", "qa-break"],
  "scenarios": ["s01", "s04"],
  "datasetInfo": {
    "DimDate": { "type": "Date dimension", "grain": "One day", "use": "Time intelligence; replacing it with a full DAX date table", "defects": "Deliberately too short: only 90 days" },
    "DimProduct": { "type": "Dimension", "grain": "One product", "use": "Margin, category slicing, discontinued products" },
    "DimCustomer": { "type": "Dimension", "grain": "One customer", "use": "Segments, cohorts by join date, loyalty tiers" },
    "DimRegion": { "type": "Dimension", "grain": "One sales region", "use": "Region filters, targets, RLS" },
    "DimEmployee": { "type": "Parent-child dimension", "grain": "One employee", "use": "PATH hierarchies, RLS by org position" },
    "FactSales": { "type": "Transaction fact", "grain": "One order line", "use": "Modeling, DAX, RLS, role-playing dates", "defects": "Returns as negative quantities; OrderDate ≠ ShipDate" },
    "FactBudget": { "type": "Periodic fact (plan)", "grain": "Month × region × category", "use": "Budget vs actual at a different grain" },
    "FactInventory": { "type": "Periodic snapshot fact", "grain": "Product × week (each product held in one warehouse)", "use": "Semi-additive measures", "defects": "Summing across weeks gives a wrong answer by design" },
    "RawOrdersExport": { "type": "Raw export", "grain": "One order line, as exported", "use": "Power Query cleaning", "defects": "Header junk, mixed date formats, currency symbols, trailing spaces, inconsistent casing, a total row" },
    "SurveyWide": { "type": "Wide (pivoted) table", "grain": "One row per store, one column per month", "use": "Unpivot", "defects": "The wrong shape for analysis, on purpose" },
    "UserRegionMapping": { "type": "Security mapping", "grain": "User × region", "use": "Dynamic RLS", "defects": "Multi-region users and one ALL user" },
    "ExchangeRates": { "type": "Rate table", "grain": "Currency × week (Mondays)", "use": "Last-known-rate currency conversion" },
    "CustomerTargets": { "type": "Target table", "grain": "Quarter × segment × loyalty tier", "use": "Relating facts at a non-unique grain" },
    "WebEvents": { "type": "Event fact", "grain": "One click event", "use": "Funnels, sessions, window functions" }
  },
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Star schema guidance", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/star-schema", "src": "official" }
  ]
}
---
## Three tiers

| Tier | Size | Purpose | Where |
|---|---|---|---|
| **Learning** | 4–100 rows per table | See every row, check every answer by eye, learn the concept without noise | The 14 Northwind datasets below |
| **Scenario** | Thousands of rows, realistic mess | Real problems: duplicates, late data, currencies, schema changes, conflicting definitions | Company pack and scenario files used by Experience Mode and the tracks |
| **Enterprise** | 100 thousand to 50 million rows | Design and performance: cardinality, partitions, incremental refresh, aggregations | Generated on your machine |

Every dataset is generated from a fixed seed, so every learner gets identical numbers and every expected result on this site can be checked automatically.

## Learning datasets

All 14 tables describe one fictional company, Northwind Outdoors, and join to each other, so any exercise can grow into a full model. "Planted problems" are there to teach you something; the lessons that use them tell you what to look for.

::: datasets

## Scenario files

Larger files used by the SQL, warehousing, testing and automation tracks and by the Experience Mode scenarios. The company pack is a realistic order system (orders, lines, returns, customers, products, regions and exchange rates) with real-world defects such as a re-exported batch of duplicate lines.

::: track-files

## Enterprise scale

Small data teaches the logic; big data teaches the design. Generate realistic sales data with skewed customers, late-arriving rows, duplicates, several currencies and slowly changing customers, on your own machine with Node.js:

```bash
node tools/generate-enterprise-data.js --rows 1000000
```

| Rows | What it teaches |
|---|---|
| 100 thousand | Everything still works; habits matter more than speed |
| 1 million | Column cardinality and model size become visible in VertiPaq Analyzer |
| 10 million | Incremental refresh and query folding stop being optional |
| 50 million | Aggregations, partitions and capacity limits |

The generator's defects are configurable and counted exactly, so you can check whether your cleaning caught all of them. See [the generator guide](https://github.com/sudhanshumukherjeexx/power-bi/blob/main/docs/enterprise-data.md).

## Labs: break it, then fix it

The best way to understand a failure is to cause it on purpose:

| Lab | Break | Then |
|---|---|---|
| Double counting | Append the March file twice | Find it with a row count per key; fix with a distinct key |
| Orphan facts | Delete two products from DimProduct | Find the blank row; count orphans with an anti join |
| Bidirectional chaos | Set every relationship to Both | Watch a total change; explain why |
| Folding | Add an index column before the date filter | See View Native Query disappear; move the step |
| RLS leak | Add a table not related to the security table | Show that a restricted user sees all of it |
| Memory | Add a timestamp column with seconds to the 10M-row table | Measure the size in VertiPaq Analyzer; split date and time |

The testing track's [Build it, break it](testing.html#qa-break) topic turns these into graded assignments.

## Scenarios by stage

::: scenarios
