---
{
  "id": "dax-debugging",
  "title": "My DAX is wrong. What do I do?",
  "summary": "A decision tree for wrong numbers: wrong everywhere, wrong only at the total, wrong after a slicer, wrong last year, a relationship that doesn't filter, or right but slow.",
  "door": "patterns",
  "group": "Troubleshooting",
  "kind": "tree",
  "order": 2,
  "stages": ["analyst", "developer", "senior"],
  "skills": ["dax", "modeling", "testing"],
  "tools": ["desktop", "dax-query-view", "dax-studio"],
  "problems": ["wrong-number", "wrong-total", "relationship"],
  "keywords": ["wrong result", "debug dax", "total wrong", "blank", "measure wrong", "slicer", "previous year wrong", "doesn't filter", "duplicate", "many to many"],
  "lessons": ["b-dax", "i-dax", "a-dax", "qa-model"],
  "scenarios": ["s02", "d02"],
  "templates": ["validation-plan"],
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "DAX query view", "u": "https://learn.microsoft.com/en-us/power-bi/transform-model/dax-query-view", "src": "official" },
    { "t": "Model relationships in Power BI Desktop", "u": "https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand", "src": "official" },
    { "t": "DAX Studio documentation", "u": "https://daxstudio.org/docs/intro/", "src": "specialist" }
  ]
}
---
## First, three questions

Before you change a formula, answer these, in writing if the number is going to an executive:

1. **What is the right answer, and how do you know?** Reconcile one cell by hand from the source: a filter on the CSV, a SQL query, the ledger. Without an expected value you are guessing.
2. **Where is it wrong?** Every cell, only the total, only for some members, only after a slicer?
3. **When did it start?** A measure that was right yesterday points at data or model changes, not at DAX.

## The tree

```tree
The result is wrong
  Wrong in every cell, including the total?
    → The base logic or the data is wrong. Check the base measure in DAX query view against your hand calculation.
    → Check for duplicates: a re-exported file, a merge that multiplied rows. Count rows per key.
    → Check types: text that looks like numbers, dates parsed in the wrong locale.
  Right per row, wrong at the total?
    → The total is evaluated in its own filter context, not as the sum of the rows. See "The total is wrong" below.
  Right until a slicer or filter is applied?
    → Something in the measure removes or replaces that filter (ALL, REMOVEFILTERS, a FILTER over a table). See "Slicer changes it" below.
    → Or the slicer's table doesn't reach the fact table: check relationship direction.
  Previous year, YTD or growth is wrong?
    → Date table problems: not marked, gaps, doesn't cover every year, or the visual uses a date from the fact table instead of the date table.
  A dimension doesn't filter the fact at all (same value on every row)?
    → No relationship, inactive relationship, wrong direction, or the key types differ (text "001" vs number 1).
  Blank where you expect a number?
    → No rows in that context; DIVIDE returned blank for a zero denominator; or the key is missing in the dimension (facts land on the blank row).
  Right, but slow?
    → It's a performance problem, not a correctness problem: go to the Performance Clinic.
```

Performance problems: [Performance Clinic](toolkit/performance-clinic.html#dax-performance).

## Inspect the base measure

Write the measure as a query in **DAX query view** (or DAX Studio) and look at the numbers without the visual in the way:

```dax
EVALUATE
SUMMARIZECOLUMNS (
    DimRegion[RegionName],
    "Net Sales", [Net Sales],
    "Rows", COUNTROWS ( FactSales ),
    "Orders", DISTINCTCOUNT ( FactSales[OrderID] )
)
```

Then check the grain: `EVALUATE FILTER ( SUMMARIZE ( FactSales, FactSales[OrderID], FactSales[ProductKey], "n", COUNTROWS ( FactSales ) ), [n] > 1 )` lists duplicated order lines. The [Finance dispute](experience/s02-finance-disputes-revenue.html) scenario is built on exactly this.

## The total is wrong

A total cell is evaluated with no filter on the row's column, so a measure that is right per row can be "wrong" at the total for good reasons:

| What you see | Why | Fix |
|---|---|---|
| Total isn't the sum of the rows | Non-additive logic: averages, distinct counts, ratios, `MAX` | Usually correct. If the business wants the sum, iterate: `SUMX ( VALUES ( DimProduct[ProductName] ), [Measure] )` |
| Total is blank | `SELECTEDVALUE` or `HASONEVALUE` logic returns blank with many values | Decide what the total should mean and return it explicitly with `ISINSCOPE` |
| Total is far too big | An `IF` per row is skipped at the total, so the "else" branch runs on everything | Iterate over the grain where the condition applies |
| Stock or balance total is a sum of weeks | Semi-additive data summed over time | Last-date logic: see the [field manual](toolkit/dax-field-manual.html#semi-additive-measures-inventory-and-balances) |

## Slicer changes it

- `ALL ( Table )` or `REMOVEFILTERS ( Table )` inside `CALCULATE` ignores slicers on that table by design. Did you want `ALLSELECTED`?
- A filter argument on the same column **replaces** the slicer: `CALCULATE ( [Net Sales], DimProduct[Category] = "Bikes" )` shows Bikes even when the slicer says Helmets. Wrap it in `KEEPFILTERS` to intersect instead.
- `FILTER ( ALL ( FactSales ), … )` throws away every filter on the fact table.
- A slicer on a table that is on the "wrong" side of a single-direction relationship doesn't filter the facts at all.

## Relationship not filtering

Open the model view and check, in this order:

1. **Is there a relationship, and is it active?** Inactive ones (dashed lines) only work through `USERELATIONSHIP`.
2. **Direction.** Filters flow from the one side to the many side. A slicer on a fact column won't filter a dimension unless the direction is Both, which you should avoid without a reason ([guidance](https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering)).
3. **Key match.** Same data type, same values: trailing spaces, leading zeros and text vs number all break matches silently.
4. **Grain.** If the "one" side has duplicate keys, Desktop will refuse a one-to-many relationship or offer many-to-many. Many-to-many hides the duplicate problem rather than fixing it.
5. **Blank row.** Facts whose key isn't in the dimension attach to an invisible blank member. `COUNTROWS ( FILTER ( FactSales, ISBLANK ( RELATED ( DimProduct[ProductKey] ) ) ) )` counts them.

## Prove the fix

A fix isn't done until a test shows the right number and the same test would have caught the bug. Record the expected values and the query that checks them in a [validation plan](templates.html#tpl-validation-plan), and see [semantic model tests](testing.html#qa-model) for how to automate the check.
