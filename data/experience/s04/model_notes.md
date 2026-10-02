# Sales model (Import) – notes from the original author

- FactSales: 31.4M rows, one per order line, 2023-01-01 onwards. Grain: order line.
- Relationship DimCustomer[CustomerKey] 1–* FactSales[CustomerKey], **cross-filter: Both** ("so the segment slicer only shows segments with sales").
- OrderTimestamp kept for the "Last refreshed" card on the executive page.
- Model size in memory: 2.21 GB. Capacity: F64. Refresh 41 minutes.
- The page got slower over the last two months; nobody changed the measures.
