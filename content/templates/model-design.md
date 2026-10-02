# Semantic model design document

**Use it** when you create a model others will rely on, and update it with every significant change. **Readers:** reviewers, the next developer, the architect, auditors. Keep it short: the model's own descriptions hold the field-level detail.

## Template

### Purpose
<Which business questions and reports this model serves; who owns it.>

### Facts and grain
| Fact table | Grain (one row is…) | Source | Rows (approx.) | Refresh |
|---|---|---|---|---|
| <table> | <grain> | <source> | <rows> | <schedule> |

### Dimensions
| Dimension | Key | SCD type | Shared with | Notes |
|---|---|---|---|---|
| <table> | <key> | <1 / 2 / none> | <other models or facts> | <notes> |

### Relationships
<Diagram or list. Explain every inactive, bidirectional or many-to-many relationship.>

### Storage mode and refresh
<Import, DirectQuery, Direct Lake or composite, and why; incremental refresh policy; schedule; expected duration.>

### Security
<RLS roles and rules; OLS; who is in each role; link to the RLS test matrix.>

### Key measures
<Link to the KPI dictionary; list the certified definitions.>

### Performance budget
<Target page and query times on the target capacity; model size.>

### Decisions and open questions
<Link the ADRs; list what is still undecided and who decides.>

## Example (Northwind Sales)

- **Purpose:** certified sales model for the executive dashboard, regional reports and self-service. Owner: BI team; business owner: VP Sales.
- **Facts:** FactSales, one row per order line (Import, daily at 06:00); FactBudget, month × region × category.
- **Dimensions:** DimDate (marked date table), DimCustomer (SCD type 2 on region), DimProduct, DimRegion.
- **Relationships:** single direction; ShipDate → DimDate inactive, used with USERELATIONSHIP.
- **Security:** dynamic RLS on UserRegionMapping; OLS hides cost columns from the Sales role.
- **Budget:** every page under 3 seconds on the production capacity; model under 1 GB.
