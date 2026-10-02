# Data dictionary

**Use it** for every semantic model other people build reports on. **Readers:** report authors, analysts, auditors, the next developer. Generate as much as you can from the model's descriptions so it never drifts from the model.

## Template

| Table | Column or measure | Type | Description (business) | Example values | Source | Visible | Notes |
|---|---|---|---|---|---|---|---|
| <table> | <name> | <data type or measure> | <what it means, in one sentence> | <two or three values> | <system.table.column> | <yes / hidden> | <caveats, units, sort-by column> |

## Example (Northwind)

| Table | Column or measure | Type | Description (business) | Example values | Source | Visible | Notes |
|---|---|---|---|---|---|---|---|
| FactSales | OrderID | Text | Order number from the order system; several lines share one OrderID | SO-500001 | orders.OrderID | Hidden | Use for distinct order counts and drill-through |
| FactSales | Quantity | Whole number | Units on the line; negative for returns | 1, 2, -1 | order_lines.Qty | Hidden | Use the Units measure instead |
| DimCustomer | Segment | Text | Customer type used for pricing and targets | Consumer, Business | customers.Segment | Yes | |
| Measures | Net Sales | Currency | Quantity × unit price × (1 − discount), returns included as negatives | $12,480.50 | FactSales | Yes | See the KPI dictionary for what it excludes |

## Keep it true

- [ ] Descriptions live in the model (they show as tooltips in the field list) and this document is exported from them.
- [ ] Every visible column and every measure has a row.
- [ ] Reviewed whenever a pull request adds or renames a field.
