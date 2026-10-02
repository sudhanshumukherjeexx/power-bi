# Source-to-target mapping

**Use it** before building or changing a load, so the source team, the BI team and the reviewer agree what each target column is made from. **Readers:** data engineers, BI developers, testers.

## Template

**Load:** <full or incremental, on which column> · **Schedule:** <when> · **Owner:** <team> · **Late-arriving data:** <how handled> · **Duplicates:** <how detected>

| Target table.column | Source system.table.column | Transformation rule | Data type | Nulls allowed | Test |
|---|---|---|---|---|---|
| <dw.table.column> | <src.table.column> | <exact rule: trim, map, look up, default> | <type> | <yes / no, default> | <how you prove it> |

## Example (Northwind order lines → FactSales)

| Target | Source | Rule | Type | Nulls | Test |
|---|---|---|---|---|---|
| FactSales.OrderID | order_lines.OrderID | As is | text | No | Every value exists in orders |
| FactSales.LineNo | order_lines.LineNo | As is | int | No | (OrderID, LineNo) unique after de-duplication |
| FactSales.CustomerSK | orders.CustomerID | Look up the DimCustomer version valid on OrderDate (SCD type 2) | int | No; unknown → -1 | No -1 rows in the last 30 days |
| FactSales.NetAmountUSD | order_lines.Qty × UnitPrice × (1 − DiscountPct / 100) × fx_rates.USDPerUnit | Convert at the order month's rate | decimal(18,2) | No | Monthly total within 0.01 of the ledger |
