---
{
  "id": "modeling-patterns",
  "title": "Semantic modeling pattern library",
  "summary": "Fact and dimension patterns with when to use each: transaction, snapshot, accumulating and factless facts, mixed grains, conformed, role-playing, SCD 1 and 2, junk, degenerate, parent-child and bridge dimensions, plus bad vs good model diagrams.",
  "door": "patterns",
  "group": "Design",
  "kind": "pattern",
  "order": 5,
  "stages": ["developer", "senior", "engineer", "architect"],
  "skills": ["modeling", "warehousing", "architecture"],
  "tools": ["desktop", "tabular-editor", "sql"],
  "problems": ["model-design", "relationship", "wrong-total", "memory"],
  "certs": ["pl300", "dp600"],
  "keywords": ["star schema", "snowflake", "fact table", "dimension", "grain", "transaction fact", "periodic snapshot", "accumulating snapshot", "factless", "conformed dimension", "role-playing", "scd type 1", "scd type 2", "junk dimension", "degenerate dimension", "parent-child", "bridge table", "many to many", "kimball"],
  "lessons": ["b-model", "i-model", "dw-keys", "dw-facts", "dw-dims", "dw-time"],
  "scenarios": ["s05", "s01"],
  "templates": ["model-design", "data-dictionary"],
  "download": true,
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Understand star schema and the importance for Power BI", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/star-schema", "src": "official" },
    { "t": "Model relationships in Power BI Desktop", "u": "https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand", "src": "official" },
    { "t": "Many-to-many relationship guidance", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/relationships-many-to-many", "src": "official" },
    { "t": "Slowly changing dimension type 2 in Fabric Data Factory", "u": "https://learn.microsoft.com/en-us/fabric/data-factory/slowly-changing-dimension-type-two", "src": "official" },
    { "t": "The Data Warehouse Toolkit (Kimball and Ross)", "u": "https://www.kimballgroup.com/", "src": "book", "paid": true }
  ]
}
---
## The one rule: decide the grain first

Every fact table has a **grain**: what one row means ("one order line", "one product per warehouse per week"). Write it down before you add a column. Most modeling bugs (double counting, totals that don't add up, budgets that can't be compared with sales) are grain bugs.

## Bad vs good

### The flat table

```diagram
 BAD: one wide table                               GOOD: a star
 ┌─────────────────────────────────────┐          DimDate ─┐
 │ OrderID, OrderDate, CustomerName,   │          DimCustomer ─┤
 │ CustomerCity, Segment, ProductName, │                       ├──► FactSales (one row per order line)
 │ Category, Brand, Region, Manager,   │          DimProduct ──┤      keys + Quantity, UnitPrice, Discount
 │ Quantity, UnitPrice, Discount, …    │          DimRegion ───┘
 └─────────────────────────────────────┘
 Repeats every customer and product attribute on every row, can't hold a budget or a second fact,
 and makes time intelligence and RLS awkward.
```

### Facts related to facts

```diagram
 BAD: FactSales ◄──── many-to-many ────► FactBudget          GOOD: both facts filtered by shared dimensions
                                                               DimDate (month) ──► FactSales
 Totals repeat or vanish depending on                          DimDate (month) ──► FactBudget
 the visual; nobody can explain the numbers.                   DimRegion       ──► FactSales, FactBudget
                                                               Category        ──► FactSales (via DimProduct), FactBudget
```

### Snowflake and bidirectional chains

```diagram
 BAD: FactSales ◄── DimProduct ◄─both─► DimSubCategory ◄─both─► DimCategory
 GOOD: flatten SubCategory and Category into DimProduct; single-direction relationships
```

## Fact patterns

| Pattern | Grain | Example | Watch out for |
|---|---|---|---|
| **Transaction fact** | One row per event | `FactSales`: one order line | Duplicates from re-exports; returns as negative rows or a separate fact |
| **Periodic snapshot** | One row per entity per period | `FactInventory`: stock per product per week | Semi-additive: never sum over time ([pattern](toolkit/dax-field-manual.html#semi-additive-measures-inventory-and-balances)) |
| **Accumulating snapshot** | One row per process instance, updated as it moves | Order lifecycle: ordered, packed, shipped, delivered dates on one row | Several date roles; rows change after load |
| **Factless fact** | One row per occurrence or eligibility, no measure | Attendance, "customer eligible for promotion" | Count rows; the absence of a row is information |
| **Multiple fact tables** | Each its own grain | Sales and Budget | Relate each to shared (conformed) dimensions, never to each other |
| **Different grains** | Daily sales, monthly targets | `FactSales` vs `FactBudget` | Relate the coarser fact to a coarser attribute (month, category); blank below its grain |

## Dimension patterns

| Pattern | What it is | Example | Teach yourself with |
|---|---|---|---|
| **Conformed dimension** | One dimension shared by several facts, with the same keys and meaning | One `DimCustomer` for Sales, Returns and Support | [Sprint 05](experience/s05-one-revenue-semantic-model.html) |
| **Role-playing dimension** | One dimension used in several roles | `DimDate` as Order Date and Ship Date | `USERELATIONSHIP`, or a second date table if both roles are needed on one visual |
| **SCD type 1** | Overwrite the attribute; no history | Correcting a misspelt city | [Keys and SCDs](warehousing.html#dw-keys) |
| **SCD type 2** | New row per change with valid-from/to and a surrogate key; facts point at the version current when they happened | Customer moves region: old sales stay in the old region | [Keys and SCDs](warehousing.html#dw-keys) |
| **Junk dimension** | Several low-cardinality flags combined into one small dimension | IsPromo × IsOnline × PaymentType | [Dimension patterns](warehousing.html#dw-dims) |
| **Degenerate dimension** | A dimension attribute with no table, kept on the fact | `OrderID` on `FactSales` | Use it for counts and drill-through; don't build a dimension for it |
| **Parent-child** | A self-referencing hierarchy | `DimEmployee[ManagerKey]` → `EmployeeKey` | `PATH`, `PATHITEM` to flatten into levels |
| **Bridge** | Resolves many-to-many between a dimension and a fact or two dimensions | Accounts with several owners; products in several promotions | Bridge table plus a bidirectional or `CROSSFILTER` relationship, used deliberately ([guidance](https://learn.microsoft.com/en-us/power-bi/guidance/relationships-many-to-many)) |

## SCD type 2 in practice

```sql portable
-- the dimension keeps every version
-- CustomerSK (surrogate key), CustomerID (business key), Region, ValidFrom, ValidTo, IsCurrent
-- facts store CustomerSK of the version valid on the transaction date
SELECT f.*, d.CustomerSK
FROM staging_sales AS f
JOIN dim_customer AS d
  ON d.CustomerID = f.CustomerID
 AND f.OrderDate >= d.ValidFrom AND f.OrderDate < d.ValidTo;
```

Decide which attributes are type 2 (tracked) and which are type 1 (overwritten), and record the decision in the [model design document](templates.html#tpl-model-design). Microsoft documents SCD type 2 loading with Fabric Data Factory; see the references.

## Model checklist

- [ ] Every fact's grain is written down
- [ ] Dimensions have unique keys and no blanks; facts' keys all exist in the dimensions
- [ ] Relationships are one-to-many, single direction, on integer keys where possible
- [ ] No fact is related directly to another fact
- [ ] One marked date table covers every date in every fact
- [ ] Measures for every number; keys and technical columns hidden
- [ ] Bidirectional and many-to-many relationships each have a written reason

The full version is the [model review checklist](toolkit/checklists.html#model-review-checklist).
